import { Routes, Route } from 'react-router-dom'

import Board from './components/Board';
import Home from './components/Home';
import Menubar from './components/Menubar';
import Profile from './components/Profile';
import AnalysisBoard from './components/AnalysisBoard';

import ChessBG from "./media/ChessBG.jpg"

import { useState, useEffect } from 'react';

import io from 'socket.io-client'

import Axios  from 'axios';



const socket = io.connect("https://chass.onrender.com")

const App = () =>{
    const [loggedUser, setLoggedUser] = useState("")
    const [loggedDisplay, setLoggedDisplay] = useState("")
    const [inGame, setInGame] = useState(false)
    const [rating, setRating] = useState("Unrated")

    useEffect(()=>{
        localStorage.setItem('loggedUser', loggedUser)
    }, [loggedUser])

    useEffect(()=>{
        localStorage.setItem('loggedDisplay', loggedDisplay)
    }, [loggedDisplay])

    useEffect(()=>{
        localStorage.setItem('inGame', inGame)
    }, [inGame])

    useEffect(()=>{
        localStorage.setItem('rating', rating)
    }, [rating])

    useEffect(()=>{
        console.log(localStorage.getItem('loggedUser'))
        if(localStorage.getItem('loggedUser')){
            setLoggedUser(localStorage.getItem('loggedUser'))
            setLoggedDisplay(localStorage.getItem('loggedDisplay'))
            setInGame(localStorage.getItem('inGame'))
            setRating(localStorage.getItem('rating'))
        }
    },[])
    
    
    return(
        <>
        <div>
            <Menubar setLoggedUser={setLoggedUser} setLoggedDisplay = {setLoggedDisplay} inGame = {inGame} setRating = {setRating}/>
            <Routes>
                <Route path = "/" element={<Home user = {loggedUser} displayName = {loggedDisplay} setInGame = {setInGame} socket = {socket}/>} ></Route>
                <Route path = "/Board" element={<Board user = {loggedUser} setInGame = {setInGame} rating = {rating} socket = {socket} setRating = {setRating}/>} ></Route>
                <Route path = "/Profile" element={<Profile user = {loggedUser} displayName = {loggedDisplay} rating = {rating}/>}></Route>
                <Route path ='/Analysis' element = {<AnalysisBoard />}></Route>
            </Routes>
            </div>
        </>
    )
    
}

export default App;