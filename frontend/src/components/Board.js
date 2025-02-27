import { Chessboard } from "react-chessboard";
import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import moveAudio from "../media/move-self.mp3"
import captureAudio from "../media/capture.mp3"
import { useLocation, Link } from "react-router-dom";


import { Typography, List, ListItemText, Box, TextField, Grid, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ListItem } from "@mui/material";
import Axios from "axios"

import io from 'socket.io-client'





const socket = io.connect(process.env.REACT_APP_SERVER_URL)
//const socket = io.connect("https://chess-rooms-app.onrender.com")

const Board = ({user, setInGame, rating, socket, setRating}) =>{
    const [chatLog, setChatLog] = useState([])
    const [game, setGame] = useState(new Chess());
    const turn = useRef(false)
    const [opponent, setOpponent] = useState("");
    const location = useLocation();
    let {roomName} = location.state;
    let {name} = location.state;
    const color = useRef("")
    const moveSound = new Audio(moveAudio);
    const captureSound = new Audio(captureAudio);
    const [mySeconds, setMySeconds] = useState(900)
    const [myTime, setMyTime] = useState("")
    const [oppTime, setOppTime] = useState("Waiting for opponent...")
    const [oppRating, setOppRating] = useState(0)
    //const wonOnTime = useRef(false)
    const [winner, setWinner] = useState("")
    const gameOver = useRef(false)
    const [open, setOpen] = useState(false);
    const [postGameText, setPostGameText] = useState("")
    const [postGameText2, setPostGameText2] = useState("")
    


    const handleClose = () => {
        setOpen(false);
    };

    const sendBoard = (data) =>{ //Called everytime I make a valid move, I would like to just send the new move in the future 
        socket.emit("send_move", {move: data, room: roomName})
    }

    const joinRoom = () =>{ //Called immediately on render
        socket.emit("join_room", roomName)
        //console.log(`Joining room ${roomName}`)
    }

    
    function makeAMove(move) { //Kind of hacky function validating move/updating board
        const gameCopy = new Chess();
        gameCopy.loadPgn(game.pgn());
        const result = gameCopy.move(move);
        if(result){
            setGame(gameCopy); 
            sendBoard(gameCopy.pgn())
            turn.current = false
            localStorage.setItem("turn", turn.current)
            //console.log(turn.current)
            if(result.captured){
                captureSound.play()
                socket.emit("sfx_capture", roomName)
            }
            else{
                moveSound.play()
                socket.emit("sfx_move", roomName)
            }
        }
        
        //console.log(gameCopy.pgn())
        return result;
    }

    
    function onDrop(sourceSquare, targetSquare) {//When moving a piece on the board
        if(game.turn() == 'w' && `${color.current}` == "white" || game.turn() == 'b' && `${color.current}` == "black"){
            const try1 = makeAMove({
                from: sourceSquare,
                to: targetSquare,
                promotion: "q"
            });
            if(!try1){
                makeAMove({
                    from: sourceSquare,
                    to: targetSquare,
            });
            }
        }
    }

    function handleKeyDown(e){ //For chat 
        let s = e.target.value
        if (e.key === 'Enter' && s.length > 0) { //Make sure valid message
            s = `${name}: `+s
            setChatLog(chatLog =>[...chatLog, s])
            socket.emit("send_chat", {message: s, room: roomName})
            e.target.value = ""
        }
    }


    //Save PGN to mondodb user and update elo rating
    const savePGN = (result) =>{
      Axios.post(`${process.env.REACT_APP_SERVER_URL}/saveGame`, //Change this later to be url for render server
      {
        Username: user,
        result,
        PGN: game.pgn()
      }).then((response)=>{
        //console.log("Saved game: " + game.pgn())
      })
      if(rating != "Unrated" && oppRating != "Unrated"){
        let p1 = probability(oppRating, rating) //My probability of winning
        let p2 = probability(rating, oppRating) //Opp probability of winning
        let newRating = 0
        let k = 30
        rating = parseInt(rating)
        setOppRating(parseInt(oppRating))
        if(result == "win"){
            newRating = rating + k * (1-p1) 
        }
        else if(result == "loss"){
            newRating = rating+k*(0-p1)
        }
        else if(result == 'draw'){
            if(rating > oppRating){
                newRating = (rating+k*(0-p1))/2
            }
            else if(rating < oppRating){
                newRating = (rating+k*(0-p1))/2
            }
        }
        else{
            console.log("Error win/loss/draw?")
        }
        newRating = Math.round(newRating)
        setRating(newRating)
        Axios.post(`${process.env.REACT_APP_SERVER_URL}/updateRating`,
            {
                Username: user,
                newRating
            }
        ).then((response)=>{
            //console.log(`New rating is ${newRating}`)
        })

      }
      socket.emit("dc_from_room", roomName)
    }

    //Calculate probability, helper function to calculate updated ratings
    function probability(rating1, rating2) {
        return (
            (1.0 * 1.0) / (1 + 1.0 * Math.pow(10, (1.0 * (rating1 - rating2)) / 400))
        );
    }   



    useEffect(()=>{
        //name = `${name}(${rating})`
        if(localStorage.color){
            socket.emit("reconnect_room", roomName)
            color.current = localStorage.getItem('color')
            //setGame(localStorage.getItem('game'))
            const gameCopy = new Chess()
            gameCopy.loadPgn(localStorage.getItem('game'))
            setGame(gameCopy)
            setOppRating(localStorage.getItem('oppRating'))
            setChatLog(JSON.parse(localStorage.getItem('chatLog')))
            setOpponent(localStorage.getItem('oppName'))
            setOppTime(localStorage.getItem('oppTime'))
            setMySeconds(localStorage.getItem('mySeconds'))
            turn.current = localStorage.getItem('turn')
            gameOver.current = false
            setInGame(true)
        }
        else{
            socket.emit("set_nickname", name)
            joinRoom()
            gameOver.current = false
            setInGame(true)
        }
        
    }, [])

    useEffect(()=>{
        //console.log(chatLog)
        localStorage.setItem("chatLog", JSON.stringify(chatLog))
    }, [chatLog])

    useEffect(()=>{//Updating time, gets called on game start 
        const interval = setInterval(()=>{
            if(turn.current && !gameOver.current){
                //console.log(turn.current)
                setMySeconds(mySeconds => mySeconds - 1)
            }
            //console.log(game)
        }, 1000)
        return () =>{
            clearInterval(interval)
        }
    }, [color])


    //Not sure why I couldn't put it after setMySeconds above...
    useEffect(()=>{
        localStorage.setItem("mySeconds", mySeconds)
        //Formatting time
        if(Math.floor(mySeconds/60) < 10 && mySeconds%60 < 10){
            setMyTime("0"+Math.floor(mySeconds/60).toString()+" : 0"+(mySeconds%60).toString())
        }
        else if(mySeconds%60 < 10){
            setMyTime(Math.floor(mySeconds/60).toString()+" : 0"+(mySeconds%60).toString())
        }   
        else if(Math.floor(mySeconds/60) < 10){
            setMyTime("0"+Math.floor(mySeconds/60).toString()+" : "+(mySeconds%60).toString())
        }//11 26
        else{
            setMyTime(Math.floor(mySeconds/60).toString()+" : "+(mySeconds%60).toString())
        }
        if(mySeconds <= 0){
            let data = {
                col: color.current,
                room: roomName
            }
            socket.emit("no_time", data)
            if(color.current == "white"){
                //alert("Black won")
                setWinner("b")
            }
            if(color.current == "black"){
                //alert("White won")
                setWinner("w")
            }
            
            //wonOnTime.current = true
        }
    },[mySeconds])

    useEffect(()=>{
        let data = {
            time: myTime,
            room: roomName
        }
        socket.emit("send_time", data)
        //console.log(myTime)
    }, [myTime])
    

    useEffect(()=> {//Checking if game is over
        //console.log(1)
        if(game.isGameOver()){
            if(game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()){
                //alert("Stalemate");
                setWinner("s")
                
            } 
            else if(game.turn() == "b"){
                //alert("White won");
                setWinner("w")
            }
            else if(game.turn() == "w"){
                //alert("Black won");
                setWinner("b")
            }
        }
        localStorage.setItem('game', game.pgn())
    }, [ game ]);

    useEffect(()=>{//Handle end of game
        //console.log(winner)
        if(winner == "s"){
            setOpen(true);
            gameOver.current = true
            setPostGameText("Stalemate")
            savePGN("draw")
            //alert("Stalemate...")
        }
        else if(winner == "w"){
            setOpen(true);
            gameOver.current = true
            setPostGameText("White Won")
            if(color.current == "white"){
                savePGN("win")
            }
            else{
                savePGN("loss")
            }
            //alert("White won...")
        }
        else if(winner == "b"){
            setOpen(true);
            gameOver.current = true
            setPostGameText("Black Won")
            if(color.current == "black"){
                savePGN("win")
            }
            else{
                savePGN("loss")
            }
            //alert("Black won...")
        }
        /*
        if(user && winner == "b" || user && winner == "w"){//useffect fires off on render, dont want to save empty games, only completed games
            //console.log(user + " won")
            savePGN()
        }
        else{
            //console.log("Guest won")
        }*/
    }, [winner])
    useEffect(()=>{ //Getting data from opponent/server
        socket.on("receive_move", (data)=>{ //Receiving new board data
            const gameCopy = new Chess();
            gameCopy.loadPgn(data);
            setGame(gameCopy)
            turn.current = true
            localStorage.setItem("turn", turn.current)
            //console.log("recieved")

        })
        socket.on("receive_color", (col) =>{ //Receive decided color, will be chosen at random and sent here
            color.current = col
            localStorage.setItem('color', col)
            if(col == "white"){
                turn.current = true
                localStorage.setItem("turn", turn.current)
            }
        })
        socket.on("get_opponent", (oppName) =>{ //Receive opponent name
            setOpponent(opponent => oppName)
            localStorage.setItem("oppName", oppName)
            setChatLog(chatLog =>[...chatLog, oppName+" has joined the room"])
        })
        socket.on("receive_chat", (s)=>{ //Recieve chat
            setChatLog(chatLog =>[...chatLog, s])
        })
        socket.on("receive_time", (t)=>{ //Receive time, will be taken/sent every second to stop timers from getting out of sync
            setOppTime(t)
            localStorage.setItem("oppTime", t)
            //console.log(t)
        })
        socket.on("win_game", (col)=>{ //Only happens if game was won on time
            //console.log("Won on time")
            if(col == "white"){
                setWinner("b")
            }
            if(col == "black"){
                setWinner("w")
            }
        })
        socket.on("sfx_move", () =>{
            moveSound.play()
        })
        socket.on("sfx_capture", () =>{
            captureSound.play()
        })
        socket.on("check_reconnect", ()=>{
            socket.emit("reconnect_room", roomName)
            socket.to(roomName).emit("updateName")
        })
        socket.on("send_opp_rating", () =>{
            socket.emit("send_rating", {room: roomName, rating})
        })
        socket.on("get_opp_rating", (r)=>{
            //console.log(123)
            setOppRating(r)
            localStorage.setItem("oppRating", r)
        })
        socket.on("won_opp_quit", ()=>{
            /*
            if(color.current == "white"){
                setWinner("w")
            }
            if(color.current == "black"){
                setWinner("b")
            }
            setPostGameText2("(Opponent has quit)")*/
            setOpponent("Disconnected...")
        })
        socket.on("update_name",()=>{
            setOpponent(opponent)
        })
    }, [socket])

    return (
    <>
    <Typography align="right" variant = "h4" marginRight={30}>Room: {roomName}</Typography>
    <Grid container columnSpacing = "7em" direction="row"
        alignItems="center"
        justifyContent="center"
        sx = {{maxHeight: '100%',
                maxWidth: '100%',}}
                >
        <Grid item sx = {{maxHeight: '100%',
                maxWidth: '100%',}}>
            <div style = {{marginTop: '1vw', display: 'inline-block', flexDirection: 'row', float: 'left'}}>
                    <Typography variant = "h4" align="left">{opponent}({oppRating})</Typography>
                </div>
                <div style = {{marginTop: '1vw', display: 'inline-block', flexDirection: 'row', float: 'right'}}>
                    <Typography variant = "h4" align="right">{oppTime}</Typography>
                </div>
                <div style={{width: '45em'}}>
                <Chessboard position={game.fen()} onPieceDrop={onDrop} id="BasicBoard" boardOrientation={color.current} />
                </div>
                <div style = {{marginTop: '3em'}}>
                <div style = {{marginTop: '1vw', display: 'inline-block', flexDirection: 'row', float: 'left'}}>
                    <Typography variant = "h4" align="left">{name}({rating})</Typography>
                </div>
                <div style = {{marginTop: '1vw', display: 'inline-block', flexDirection: 'row', float: 'right'}}>
                    <Typography variant = "h4" align="right">{myTime}</Typography>
                </div>
            </div>
        </Grid>   
        <Grid item>
            <Box sx={{border: '1px solid grey', height: "40em", width: "30em"}}>
                <Typography variant = "h4" align="center">Chat</Typography>
            <List sx={{
                bgcolor: 'background.paper',
                position: 'relative',
                overflowY: 'auto',
                height: '90%',
                maxWidth: '100%',
                marginLeft: '4em',
                textOverflow: "ellipsis"
            }}>
                {chatLog.map((elem)=>(
                    <ListItem>
                    <ListItemText
                    style={{wordWrap: "break-word"}} 
                    primary={`${elem}`} 
                    primaryTypographyProps={{ style: { whiteSpace: "normal" } }} />
                    </ListItem>

                ))}
            </List>    
            </Box>
            <TextField label="Say something..." variant="outlined" sx = {{width: '30em', bottom: 0}} onKeyDown = {handleKeyDown} />
        </Grid>   
    </Grid>
        <Dialog
        open={open}
      >
        <DialogTitle id="responsive-dialog-title" textAlign={"center"}>
          {postGameText}{postGameText2}
          
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {"Close me to return home..."}
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{justifyContent: "center"}}>
          <Button autoFocus component = {Link} to = "/" >
            Return Home
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
    
}

export default Board;