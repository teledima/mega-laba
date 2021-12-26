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
	
	function sendMessage(socket, msg){
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
            ws.current = new WebSocket("ws://127.0.0.1:4002"); // создаем ws соединение
            //ws.current.onopen = () => setStatus("Соединение открыто");	// callback на ивент открытия соединения
            ws.current.onclose = () => setStatus("Соединение закрыто"); // callback на ивент закрытия соединения
			
            gettingData();
        }
        return () => ws.current.close(); // кода меняется isPaused - соединение закрывается
    },[ws, isPaused])

    const gettingData = useCallback(() => {
        if (!ws.current) return;

        ws.current.onmessage = e => {                //подписка на получение данных по вебсокету
            console.log(e.data)

			if (isPaused) return;
            const message = JSON.parse(e.data);
            setPhotoList(message);
        };
    }, [isPaused]);

    const sendPhotoInfo = async() => {
		console.log(photoInfo)
		if (photoInfo) {
			sendMessage(ws.current, JSON.stringify(photoInfo))
            ws.current.send(JSON.stringify(photoInfo));	// callback на ивент открытия соединения

            ws.current.onmessage = e => {
                console.log('Get resized image: ', e)
                saveAs(`data:image/png;base64,${JSON.parse(e.data).resizeResult}`)
                
            }
        }
		return true;
    }

    const handeClickPhoto = (e) => {
        setDialogOpen(true)
        setPhotoId(e.currentTarget.id)
    }


    useEffect(() => {
        webSocket()
    },[])

    useEffect(()=>{
        sendPhotoInfo()
    },[photoInfo, setPhotoInfo])
    
    return (
        <div className='main'>
            <form onSubmit={handleSubmit(onSubmitHandler)}>

                <Button
                    variant="contained"
                    component="label"
                >
                Выбрать файл
                <input
                    type="file"
                    hidden
                    {...register('image', { required: 'Это обязательное поле' })} 
                />
                </Button>
                <Button variant="contained" color="primary" type="submit" style={{marginLeft: '10px'}}>
                    Загрузить фото
                </Button>
            </form>
            <div className='photoList'>
                <h2>{status}</h2>
                {
					photoList?.map((item)=>{
						return (
                            <Paper id={`${item.name}`} elevation={3} onClick={e=>handeClickPhoto(e)}> 
								<h2>{item.name}</h2>
                            </Paper>
						)
					})
				}
            </div> 

            <PhotoDialog
                isDialogOpen={isDialogOpen}
                setDialogOpen={setDialogOpen}
                setPhotoInfo={setPhotoInfo}
                photoId={photoId}
            />
        </div>
    )
}

export default App;
