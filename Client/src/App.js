// *** NPM ***
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import Button from '@material-ui/core/Button'

// *** OTHER ***
import instance from './instance'
import PhotoDialog from './components/PhotoDialog/PhotoDialog';

const App = () => {
    const { register, handleSubmit } = useForm()
    const [photoList, setPhotoList] = useState()
    const [isPaused, setIsPaused] = useState(false);
    const [isDialogOpen, setDialogOpen] = useState(true)
    const [status, setStatus] = useState("");
    const [photoInfo, setPhotoInfo] = useState()
    const ws = useRef(null);


    const onSubmitHandler = async (data) => {
        try {
            const formData = new FormData()
            const imageList = data.image

            for (let i = 0; i < imageList.length; i += 1) {
                formData.append('images', imageList[i])                
            }

            await instance.get('/images')

        } catch (error) {
            console.log(error)
        }
    }

    // const getPhotoList = async() => {
    //     try {
    //         const response = await instance.get('images/')
    //         setPhotoList(response.data)
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }

    const webSocket = useCallback(() => {
        if (!isPaused) {
            ws.current = new WebSocket("wss://ws.kraken.com/"); // создаем ws соединение
            ws.current.onopen = () => setStatus("Соединение открыто");	// callback на ивент открытия соединения
            ws.current.onclose = () => setStatus("Соединение закрыто"); // callback на ивент закрытия соединения

            gettingData();
        }
        return () => ws.current.close(); // кода меняется isPaused - соединение закрывается
    },[ws, isPaused])

    const gettingData = useCallback(() => {
        if (!ws.current) return;

        ws.current.onmessage = e => {                //подписка на получение данных по вебсокету
            if (isPaused) return;
            const message = JSON.parse(e.data);
            setPhotoList(message);
        };
    }, [isPaused]);

    const sendPhotoInfo = async() => {
        ws.current.send(JSON.stringify(photoInfo))
    }

    useEffect(()=>{
        webSocket()
    },[])

    useEffect(()=>{
        sendPhotoInfo()
    },[photoInfo])
    
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
                <p>{`connection ID: ${photoList?.connectionID}`}</p>
                <p>{`event: ${photoList?.event}`}</p>
                <p>{`status: ${photoList?.status}`}</p>
                <p>{`version: ${photoList?.version}`}</p>
                {/* {photoList?.map((item)=>{
                    <div>
                        <h2>{item.name}</h2>
                    </div>
                })}*/}
            </div> 

            <PhotoDialog
                isDialogOpen={isDialogOpen}
                setDialogOpen={setDialogOpen}
                setPhotoInfo={setPhotoInfo}
            />
        </div>
    )
}

export default App;
