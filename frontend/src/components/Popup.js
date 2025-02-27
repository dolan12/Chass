import {Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material"

const Popup = (popUpType, show) =>{
    if(show){
        if(popUpType == "full_room"){
            return(
                <>
                <Dialog
                >
                    <DialogTitle id="responsive-dialog-title" textAlign={"center"}>
                    {postGameText}
                    </DialogTitle>
                    <DialogContent>
                    <DialogContentText>
                        {"Room is full"}
                    </DialogContentText>
                    </DialogContent>
                    <DialogActions style={{justifyContent: "center"}}>
                    <Button>
                        Ok
                    </Button>
                    </DialogActions>
                </Dialog>
                </>
            )
    }
    
    }
    
    
}

export default Popup;