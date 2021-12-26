// *** NPM ***
import React from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent';
import { useForm } from 'react-hook-form'
import { Button, TextField, } from '@material-ui/core'

// *** OTHER ***
import styles from './PhotoDialog.module.css'
import { useEffect } from 'react';
import { useState } from 'react';


const PhotoDialog = (props) => {    
    const { isDialogOpen, setDialogOpen, setPhotoInfo, photoId} = props
    console.log(photoId)
    const { register, handleSubmit, formState: { errors } } = useForm()
    const [photo, setPhoto] = useState()


    const getPhoto = async() => {
        try {
            //const imageBuffer = Buffer.from(response.data, 'binary').toString('base64')
            // const objPhoto = photo
            //setPhoto(response.data)

        } catch (error) {
            console.log(error)
        }
    }

    const onSubmitHandler = (data) => {
        data._id = photoId
        setPhotoInfo(data)
        //saveAs( img );
        //console.log(data)
        //getBiteSize()
    }

    const handleClose = () => {
        setDialogOpen(false);
    };

    useEffect(()=> {
        if(photoId){
            getPhoto()
        }
    },[photoId])


    return(
        <Dialog
            onClose={handleClose}
            aria-labelledby="simple-dialog-title"
            maxWidth='xl'
            open={isDialogOpen}
        >
            <DialogContent className={styles.dialog} >
                <img alt="image" src={`http://localhost:8000/images/${photoId}`} />
                
                <form className={styles.form} onSubmit={handleSubmit(onSubmitHandler)}>
                    <div className={styles.inputs}>
                        <TextField
                            className={styles.input}
                            
                            {...register('new_width', { required: 'Это обязательное поле' })} 
                            helperText={errors.width?.message || ''}
                            error={!!errors.width?.message}
                            autoComplete="off"
                            variant="standard"
                            label="Ширина"
                            type="number"
                        />

                        <TextField
                            className={styles.input}                            
                            {...register('new_height', { required: 'Это обязательное поле' })}
                            helperText={errors.height?.message || ''}
                            error={!!errors.height?.message}
                            autoComplete="off"
                            variant="standard"
                            label="Высота"
                            type="number"
                        />
                    </div>

                    <Button variant="contained" color="primary" type="submit">
                        Загрузить фото
                    </Button>
                </form>
                
            </DialogContent>
      
        </Dialog>
    )
}


export default PhotoDialog