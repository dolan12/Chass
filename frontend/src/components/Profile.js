import { useState, useEffect } from "react";

import { Link, useNavigate } from "react-router-dom";

import { Box, List, ListItem, ListItemText, Grid, Typography, Button, ListItemButton } from "@mui/material";

import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { IconButton } from "@mui/material";

import Axios from "axios";

const Profile = ({user, displayName, rating}) =>{

    const [games, setGames] = useState([""])
    const [record, setRecord] = useState("")
    const [name, setName] = useState("")
    const [username, setUserName] = useState("")
    const [userRating, setUserRating] = useState(0)

    const navigate = useNavigate()
    

    const getGames = () =>{
        Axios.post(`${process.env.REACT_APP_SERVER_URL}/getUserGames`,
      {
        Username: user,
      }).then((response)=>{ 
        if(response.data){
            setGames(response.data)
            //console.log(games)
        }
        else{
          
        }
      })
    }
    const getRecord = () =>{
      Axios.post(`${process.env.REACT_APP_SERVER_URL}/getUserRecord`,{
        Username: user
      }).then((response)=>{
        setRecord(`${response.data.Wins} Wins/${response.data.Losses} Losses/${response.data.Draws} Draws`)
        
      })
    }

    const downloadTxtFile = (s) => {
      const element = document.createElement("a");
      const file = new Blob([s], {
        type: "text/plain"
      });
      element.href = URL.createObjectURL(file);
      element.download = "Game.txt";
      document.body.appendChild(element);
      element.click();
      /*
      if(e.target.value){
        navigate("/Analysis", {state: {game: e.target.value}})
      }
      else{
        console.log("Empty game string?")
      }*/
  };

    useEffect(()=>{
        //console.log("Getting games for "+user)
        if(user){
          localStorage.setItem('displayName', displayName)
          localStorage.setItem('user', user)
          localStorage.setItem('rating', rating)
        }
        else{
          user = localStorage.getItem('user')
          displayName = localStorage.getItem('displayName')
          rating = localStorage.getItem('rating')
        }
        //console.log(rating)
        setName(displayName)
        setUserName(user)
        setUserRating(rating)
        getGames()
        getRecord()
    },[])

    return(
        <>

          <Grid container columnSpacing = "7em" direction="row"
        alignItems="center"
        justifyContent="center" marginTop={4}>
          <Box component="span" sx={{ p: 10, border: '1px solid grey' }}>
          <Grid item>
            <Typography variant = "h5">Display Name: {name}</Typography>
            <Typography variant = "h5">Username: {username}</Typography>
            <Typography variant = "h5">Rating: {userRating}</Typography>
            <Typography variant = "h5">Record: {record}</Typography>
            <Typography variant = "h5">Recent Games:</Typography>
            <List
            sx={{
              width: '100%',
              marginTop: '2rem',
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'auto',
              maxHeight: 300,
            
            }}
          >
            
            {games.map((elem, i)=>
              <li>
                <ul>
                  <div style={{display: 'flex', alignItems: "center", justifyContent: "center"}}>
              <ListItem key={i}>
                  <Button value = {`${elem}`} component = {Link} to = "/Analysis" state = {{game: `${elem}`}}>{i}. Game</Button>
              </ListItem>
                <IconButton
                    aria-label = "Left icon" size = "medium"  color='inherit' onClick={()=> downloadTxtFile(`${elem}`)}
                >
                  <DownloadIcon/>
                </IconButton>
              </div>
              </ul>
              </li>
            )}
          </List>
          </Grid>
          </Box>
          

        </Grid>  
        </>
    )
}
export default Profile;