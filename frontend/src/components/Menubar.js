import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import {Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, useMediaQuery, TextField, Menu, MenuItem} from "@mui/material"
import { CssBaseline } from '@mui/material';
import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Axios from "axios"

const Menubar = ({setLoggedUser, setLoggedDisplay, inGame, setRating}) =>{
    const [open, setOpen] = useState(false)//MUI display component state
    //Textbox fields
    const [user, setUser] = useState("")
    const [pass, setPass] = useState("")
    const [displayName, setDisplayName] = useState("")

    //Track if fields are valid, used in register fields
    const [userErr, setUserErr] = useState(false) //Track whether user attempted to register with valid username
    const [displayNameErr, setDisplayNameErr] = useState(false)
    const [passwordErr, setPasswordErr] = useState(false)

    const [userLbl, setUserLbl] = useState("Username")
    const [displayLbl, setDisplayLbl] = useState("Display Name")
    const [passLbl, setPassLbl] = useState("Password")


    const [anchorEl, setAnchorEl] = useState(null)
    const loggedIn = useRef(false)
    const loggedUser = useRef("")

    const navigate = useNavigate() //using this hook to navigate to other components going to be used for entering rooms
    

    const [action, setAction] = useState("Login") //Tracks if the user is trying to login or register

    /*Menubar actions*/

    //Reset variables related to textfields when closing dialog/modal
    function handleClose(){
        setOpen(false);

        //Reset all variables related to textfields
        setUserErr(false)
        setPasswordErr(false)
        setDisplayNameErr(false)
        setUserLbl("Username")
        setPassLbl("Password")
        setDisplayLbl("Display name")
        setUser("")
        setPass("")
        setDisplayName("")
    }

    function handleLogin(){//Update the action selected on the menubar
      setAction("Login")
      setOpen(true);
    };
    function handleRegister(e){//Update the action selected on the menubar
      //console.log(e.target.value)
      setAction("Register")
      setOpen(true);
    };

    function handleUser(){//Helper function to choose to attempt login/creation of user with textfield values
        if(action == "Login"){
          loginUser()
        }
        else if(action == "Register"){
          if(user.length >= 3 && user.length <= 10){
            setUserLbl("Username")
            setUserErr(false)
            if(pass.length >= 3 && pass.length <= 10){
              setPassLbl("Password")
              setPasswordErr(false)
              if(displayName.length >= 3 && displayName.length <= 10){
                setDisplayLbl("Display name")
                setDisplayNameErr(false)
                //console.log(user.length+" "+pass.length+" "+displayName.length)
                createUser()
              }
              else{
                setDisplayNameErr(true)
                setDisplayLbl("Must be between 3-10 characters")
              }
            }
            else{
              setPasswordErr(true)
              setPassLbl("Must be between 3-10 characters")
            }
          }
          else{
            setUserErr(true)
            setUserLbl("Must be between 3-10 characters")
          }
        }
    }

    function profileMenuClose(){
      setAnchorEl(null);
    }

    function profileMenuOpen(e){
      setAnchorEl(e.currentTarget);
    }

    /*Text for MUI Display*/
    function userText(e){
      setUser(e.target.value)
    }

    function passText(e){
      setPass(e.target.value)
    }

    function displayNameText(e){
      setDisplayName(e.target.value)
    }


    function logOut(){
      loggedUser.current = ""
      loggedIn.current = false
      setLoggedUser("")
      setLoggedDisplay("")
      profileMenuClose()
      setRating("Unrated")
    }

    const createUser = () =>{
      Axios.post(`https://chass.onrender.com/createUser`, //Change this later to be url for render server
      {
        Username: user,
        Password: pass,
        DisplayName: displayName,
        Rating: 1200,
        Wins: 0,
        Losses: 0,
        Draws: 0
      }).then((response)=>{ 
        //console.log(response)
        if(!response.data){//Response.data contains the new account info if valid, and NULL if not
          setUserErr(true)
          setUserLbl("Username not available")
        }
        else{
          handleClose()
        }
      }) 
    }
    const loginUser = () =>{
      Axios.post(`https://chass.onrender.com/loginUser`, //Change this later to be url for render server
      {
        Username: user,
        Password: pass,
      }).then((response)=>{
        //console.log(response)
        if(response.data){
          //console.log(response.data.Rating)
          loggedUser.current = user
          loggedIn.current = true
          handleClose()
          setLoggedUser(user)
          setLoggedDisplay(response.data.DisplayName)
          setRating(response.data.Rating.toString())
        }
        else{
          setUserErr(true)
          setUserLbl("Incorrect login info")
        }
      })
    }

    useEffect(()=>{
      //console.log(loggedIn.current)
      
    }, [])
    if(inGame)
    {
      return(
        <>
        </>
      )
    }
    else if(!loggedIn.current){
        return (
        <>
        <CssBaseline/>
      <AppBar position="static">
        <Toolbar>
            <Box display='flex' flexGrow={1}>
            {/* left side */}
            <IconButton
            aria-label = "Home icon" size = "medium" component = {Link} to = "/" color='inherit'
          >
            <HomeIcon/>
          </IconButton>
            </Box>
          <Button color="inherit" onClick={handleLogin}>Login</Button>
          <Button color="inherit" onClick={handleRegister}>Register</Button>
        </Toolbar>
      </AppBar>
      <Dialog
        open={open}
      >
        <DialogTitle id="responsive-dialog-title" textAlign={"center"}>
            Welcome
        </DialogTitle>
        <DialogContent>
          <DialogContentText align='center'>
            <Typography>NOTE: users must be logged in to save games</Typography> 
          </DialogContentText>
          <DialogContentText align='center'>
            <TextField label={displayLbl} variant="filled" onChange={displayNameText} disabled = {action == "Login"} error = {displayNameErr}/>
          </DialogContentText>
          <DialogContentText align='center'>
            <TextField label={userLbl} variant="filled" style={{marginTop: 12}} onChange={userText} error = {userErr}/>
          </DialogContentText>
          <DialogContentText align='center'>
            <TextField label={passLbl} variant="filled" style={{marginTop: 12}} onChange={passText} error = {passwordErr}/>
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{justifyContent: "center"}}>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button autoFocus onClick={handleUser}>
            {action}
          </Button>
          
        </DialogActions>
      </Dialog>
    </>
  );
  }
  else{
    return (
        <>
        <CssBaseline/>
      <AppBar position="static">
        <Toolbar>
            <Box display='flex' flexGrow={1}>
            {/* left side */}
            <IconButton
            aria-label = "Home icon" size = "medium" component = {Link} to = "/" color='inherit'
          >
            <HomeIcon/>
          </IconButton>
            </Box>
            <div>
          <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={profileMenuOpen}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={profileMenuClose}
              >
                <MenuItem component = {Link} to = "/Profile" onClick={profileMenuClose}>Profile</MenuItem>
                <MenuItem onClick={logOut}>Log out</MenuItem>
              </Menu>
              </div>
        </Toolbar>
      </AppBar>
    </>
  );
  }
    
}

export default Menubar;