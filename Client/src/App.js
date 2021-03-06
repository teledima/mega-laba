// *** NPM ***
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import Button from '@material-ui/core/Button'
import Paper from '@material-ui/core/Paper';
import { saveAs } from 'file-saver'

// *** OTHER ***
import instance from './instance'
import PhotoDialog from './components/PhotoDialog/PhotoDialog';

const App = () => {
    const { register, handleSubmit } = useForm()
    const [photoList, setPhotoList] = useState()
    const [isPaused, setIsPaused] = useState(false);
    const [isDialogOpen, setDialogOpen] = useState(false)
    const [photoId, setPhotoId] = useState()
    const [status, setStatus] = useState("");
    const [photoInfo, setPhotoInfo] = useState()
    const ws = useRef(null);
	
	function sendMessage(socket, msg) {
		// Wait until the state of the socket is not ready and send the message when it is...
		waitForSocketConnection(socket, function(){
			console.log("message sent!!!");
			socket.send(msg);
		});
	}

	// Make the function wait until the connection is made...
	function waitForSocketConnection(socket, callback){
		setTimeout(
			function () {
				if (socket.readyState === 1) {
					console.log("Connection is made")
					if (callback != null){
						callback();
					}
				} else {
					console.log("wait for connection...")
					waitForSocketConnection(socket, callback);
				}

			}, 5); // wait 5 milisecond for the connection...
	}



    const onSubmitHandler = async (data) => {
        try {
            const formData = new FormData()
            const imageList = data.image

            for (let i = 0; i < imageList.length; i += 1) {
                formData.append('images', imageList[i])                
            }
            await instance.post('/images', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
        } catch (error) {
            console.log(error)
        }
    }

    const webSocket = useCallback(() => {
        if (!isPaused) {
            ws.current = new WebSocket(process.env.REACT_APP_WEBSOCKET); // ?????????????? ws ????????????????????
            //ws.current.onopen = () => setStatus("???????????????????? ??????????????");	// callback ???? ?????????? ???????????????? ????????????????????
            ws.current.onclose = () => setStatus("???????????????????? ??????????????"); // callback ???? ?????????? ???????????????? ????????????????????

            
            ws.current.onmessage = e => {
                const data = JSON.parse(e.data)
                console.log(data)
                if (data.type === 'all_objects')
                {
                    setPhotoList(data.list)
                }
                else if (data.type === 'new_image')
                {                   
                    setPhotoList(data.list)
                }
                else if (data.type === 'resize') {
                    saveAs(`data:image/png;base64,${data.resizeResult}`)
                }
            }
			
            gettingData();
        }
        return () => ws.current.close(); // ???????? ???????????????? isPaused - ???????????????????? ??????????????????????
    },[ws, isPaused])

    const gettingData = useCallback(() => {
        if (!ws.current) return;
    }, [isPaused]);

    const sendPhotoInfo = async() => {
		console.log(photoInfo)
		if (photoInfo) {
			sendMessage(ws.current, JSON.stringify(photoInfo))
            ws.current.send(JSON.stringify(photoInfo));	// callback ???? ?????????? ???????????????? ????????????????????
        }
		return true;
    }

    const handeClickPhoto = (e) => {
        console.log('handle click: ', e.currentTarget)
        setDialogOpen(true)
        setPhotoId(e.currentTarget.id)
    }


    useEffect(() => {
        webSocket()
    },[])

    useEffect(() => {
        sendPhotoInfo()
    }, [photoInfo])
    
    return (
        <div className='main'>
            <form onSubmit={handleSubmit(onSubmitHandler)}>

                <Button
                    variant="contained"
                    component="label"
                >
                ?????????????? ????????
                <input
                    type="file"
                    hidden
                    {...register('image', { required: '?????? ???????????????????????? ????????' })} 
                />
                </Button>
                <Button variant="contained" color="primary" type="submit" style={{marginLeft: '10px'}}>
                    ?????????????????? ????????
                </Button>
            </form>
            <div className='photoList'>
                <h2>{status}</h2>
                
                {
                    
					photoList?.map((item, i)=>{
						return (
                            <Paper key={item.name} id={item.name} elevation={3} onClick={e=>handeClickPhoto(e)}> 
								<h2>{item.name}</h2>
                            </Paper>
						)
					})
				}
            </div> 

            <PhotoDialog props={{isDialogOpen, setDialogOpen, setPhotoInfo, photoId}}
            />
        </div>
    )
}

export default App;
