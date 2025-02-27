const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
app.use(cors())
//const server = http.createServer(app)

const mongoose = require("mongoose")
const UserModel = require("./models/Users")

app.use(express.json())

const dotenv = require("dotenv");

dotenv.config();

mongoose.connect(process.env.MONGODB_CHESSROOMS_URI)

const server = app.listen(process.env.PORT,'0.0.0.0', () =>{
    console.log("Server is running")
})

//Test request
app.get("/getUsers", (req, res) =>{
    UserModel.find({}, (err, result) =>{
        if(err){
            res.json(err)
        }
        else{
            res.json(result)
        }
    })
})

app.post("/getUserRating", async(req, res)=>{
    const temp = await UserModel.findOne({ Username: req.body.Username })
    if(temp){
        res.json(temp.Rating)
    }
    else{
        res.json(err)
    }
})

app.post("/getUserGames", async (req, res)=>{
    const temp = await UserModel.findOne({ Username: req.body.Username })
    if(temp){
        res.json(temp.Games)
    }
    else{
        res.json(null)
    }
})

//Validate login
app.post("/loginUser", async (req, res)=>{
    const temp = await UserModel.findOne({ Username: req.body.Username })
    if(temp && temp.Password == req.body.Password){
        res.json(temp)
        console.log(req.body.Username+" has logged in")
    }
    else{
        console.log("Failed login")
        res.json(null)
    }

})

//Create a new user account
app.post("/createUser", async (req, res)=>{
    const temp = await UserModel.findOne({ Username: req.body.Username })
    if(!temp){
        const user = req.body
        const newUser = new UserModel(user)
        await newUser.save()
        res.json(user)
        console.log(req.body.Username+" has registered")
    }
    else{
        res.json(null)
    } 
})

//Add completed game to database
app.post("/saveGame", async (req, res)=>{
    const temp = await UserModel.findOne({ Username: req.body.Username })//Get my database entry by username
    if(temp){
        console.log("Adding game: " + req.body.PGN)
        temp.Games.push(req.body.PGN)
        if(req.body.result == "draw"){
            if(!temp.Draws){
                temp.Draws = 0
            }
            temp.Draws = temp.Draws+1 
        }
        else if(req.body.result == "win"){
            if(!temp.Wins){
                temp.Wins = 0
            }
            temp.Wins = temp.Wins+1
        }
        else if(req.body.result == "loss"){
            if(!temp.Losses){
                temp.Losses = 0
            }
            temp.Losses = temp.Losses+1
        }
        await temp.save()
    }
    else{
        console.log("Could not find user to add game to")
    }
})

app.post("/getUserRecord", async(req, res)=>{ //For getting wins losses draws by username
    const temp = await UserModel.findOne({ Username: req.body.Username })
    if(!temp.Wins){
        temp.Wins = 0
    }
    if(!temp.Losses){
        temp.Losses = 0
    }
    if(!temp.Draws){
        temp.Draws = 0
    }
    res.json(
        {Wins: temp.Wins,
        Losses: temp.Losses,
        Draws: temp.Draws
    })
})

app.post("/updateRating", async(req, res)=>{ //Update rating after game, I will validate whether both are registered users client side before doing this
    const temp = await UserModel.findOne({ Username: req.body.Username })
    temp.Rating = req.body.newRating
    await temp.save()
})




const io = new Server(server, {
    cors:{
        origin: [ "https://chass-1.onrender.com","http://localhost:3002"],
        methods: ["GET", "POST"]
    }
})


let currentRooms = new Set()


//Socket io, handles communication between boards
io.on("connection", (socket)=>{
    //socket.join("test");
    console.log(`User Connected: ${socket.id}`)
    io.to(socket.id).emit("check_reconnect") //If someone disconnects from socket and reconnects while in room
    //console.log(io.sockets.adapter.rooms)
    //console.log(socket.rooms)
    //check to make sure size is not greater than 2
    socket.on("join_room", (roomName)=>{
        socket.join(roomName)
        //console.log(`User Connected: ${socket.id} connected to room: ${roomName}`)
        if(io.sockets.adapter.rooms.get(roomName) && io.sockets.adapter.rooms.get(roomName).size == 2){
            currentRooms.add(roomName.toString())//Mark this room as in progress, in case someone disconnects midgame i dont want room to show as available
            console.log(`Starting game in room: ${roomName}`)
            const clientsArray = Array.from(io.sockets.adapter.rooms.get(roomName)); //Array of socket ids in this room
            /*
            for (let clientID of clients ) {
                console.log(clientID)
                io.to(clientID).emit("recieve_color", `${clientID}`)
            }*/
            //112697
            //CHange this later to be desired color
            io.to(clientsArray[0]).emit("receive_color", "white")
            let nick = io.sockets.sockets.get(clientsArray[1]).nickmame;
            io.to(clientsArray[0]).emit("get_opponent", nick)
            

            io.to(clientsArray[1]).emit("receive_color", "black")
            nick = io.sockets.sockets.get(clientsArray[0]).nickmame;
            io.to(clientsArray[1]).emit("get_opponent", nick)

            io.to(clientsArray[0]).emit("send_opp_rating")
            io.to(clientsArray[1]).emit("send_opp_rating")
        }
    })
    
    socket.on("send_move", (data)=>{//change this to specify room later
        //console.log(data)
        //socket.broadcast.emit("receive_move", data)
        socket.to(data.room).emit("receive_move",data.move)
    })
    socket.on("disconnecting", () => {
        //console.log(socket.rooms) 
        for(const room of socket.rooms){
            //console.log(room.toString())
            io.to(room.toString()).emit("won_opp_quit")
            if(io.sockets.adapter.rooms.get(room.toString()) && io.sockets.adapter.rooms.get(room.toString()).size == 1){//Last person in room, remove from set
                currentRooms.delete(room.toString())
            }
        }
    });
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);    
    });
    socket.on("set_nickname", (myName) =>{
        socket.nickmame = myName
    })
    socket.on("send_chat", (data)=>{
        //console.log(data)
        socket.to(data.room).emit("receive_chat", data.message)
    })
    socket.on("send_time", (data)=>{ 
        socket.to(data.room).emit("receive_time", data.time)
    })
    socket.on("no_time", (data)=>{ //Winning game on time
        socket.to(data.room).emit("win_game", data.col)
    })
    socket.on("sfx_move", (room)=>{
        socket.to(room).emit("sfx_move")
    })
    socket.on("sfx_capture", (room)=>{
        socket.to(room).emit("sfx_capture")
    })
    socket.on("reconnect_room", (room)=>{ //If socket happens to disconnect, happens every 5 minutes on render free tier
        console.log(`${socket.id} is reconnecting to room : ${room}`)
        socket.join(room)
    })
    socket.on("check_room_size", (room, socketID)=>{
        //console.log(socket.id)
        if(io.sockets.adapter.rooms.get(room) && io.sockets.adapter.rooms.get(room).size >= 2){
            io.to(socket.id).emit("valid_room", false)
        }
        else{
            io.to(socket.id).emit("valid_room",true)
        }
    })
    socket.on("send_rating", (data)=>{
        socket.to(data.room).emit("get_opp_rating", data.rating)
    })
    socket.on("dc_from_room", (room)=>{//Game ended properly
        socket.leave(room)
        currentRooms.delete(room) 
    })
    socket.on("leave_rooms", ()=>{ //In case user goes back on the browser to return home, disconnect them from previous room
        const rooms = io.sockets.adapter.sids.get(socket.id) //map of socket id to rooms in
        for(const room of rooms){ 
            if(room.toString().length <= 10){
                socket.leave(room.toString())
                socket.to(room.toString()).emit("won_opp_quit")
                if(!io.sockets.adapter.rooms.get(room.toString())){
                    currentRooms.delete(room.toString())
                }
            }
        }
    })
    socket.on("get_all_rooms_data", ()=>{
        const rooms = io.sockets.adapter.rooms
        let roomsData = []
        //console.log(currentRooms)
        for(const room of rooms){
            if(room[0].toString().length <= 10 && room[1].size == 1 && !currentRooms.has(room[0].toString())){ //If user created room and only one person inside
                //console.log(room[1])
                roomsData.push(room[0].toString())
                
            }
        }
        
        io.to(socket.id).emit("rooms_data", roomsData)
    })
    
})




