import { Chessboard } from "react-chessboard";
import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import moveAudio from "../media/move-self.mp3"
import captureAudio from "../media/capture.mp3"
import { useLocation, Link } from "react-router-dom";

import { IconButton } from "@mui/material";

import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

const AnalysisBoard = () =>{

    const moveSound = new Audio(moveAudio);
    const captureSound = new Audio(captureAudio);

    const location = useLocation();
    let {game} = location.state;
    const [replay, setReplay] = useState(new Chess())
    const replayRef = useRef(new Chess())
    const [gameFen, setGameFen] = useState("")
    const moveList = useRef([]) //Holds undo moves to redo
    replay.loadPgn(game)
    
    //const [game, setGame] = useState(new Chess());
    //need to get game string

    function undoClick(){
        /*
        const gameCopy = new Chess();
        gameCopy.loadPgn(replay.pgn());
        const res = gameCopy.undo()
        console.log(res)
        setReplay(gameCopy)*/
        const res = replayRef.current.undo()
        setGameFen(replayRef.current.fen())
        if(res){
            moveSound.play()
            moveList.current.push(res)
            /*
            if(res.captured){
                captureSound.play()
            }
            else{
                moveSound.play()
            }*/
        }
    }

    function redoClick(){
        if(moveList.current.length > 0){
            replayRef.current.move(moveList.current[moveList.current.length-1])
            setGameFen(replayRef.current.fen())
            if(moveList.current[moveList.current.length-1].captured){
                captureSound.play()
            }
            else{
                moveSound.play()
            }
            moveList.current.pop()
        }
    }

    useEffect(()=>{
        setGameFen(replay.fen())
        replayRef.current.loadPgn(game)
    }, [])


    return(
        <>
            <div style={{width: '45rem', display: 'block',marginLeft: 'auto', marginRight: 'auto', marginTop: '5rem'}}>
                <Chessboard position={gameFen} id="BasicBoard" boardOrientation={"white"}  />
                <div style={{display: 'flex', alignItems: "center", justifyContent: "center"}}>
                    <IconButton
                    aria-label = "Left icon" size = "large"  color='inherit' onClick={undoClick}
                >
                    <KeyboardArrowLeftIcon/>
                </IconButton>
                <IconButton aria-label = "Left icon" size = "large"  color='inherit' onClick={redoClick}
          >
            <KeyboardArrowRightIcon/>
          </IconButton>
                </div>
                
            </div>
        </>
    )
}

export default AnalysisBoard