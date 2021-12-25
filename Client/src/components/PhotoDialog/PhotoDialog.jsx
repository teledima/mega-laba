// *** NPM ***
import React from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent';
import { useForm } from 'react-hook-form'
import { Button, TextField, } from '@material-ui/core'

// *** OTHER ***
import styles from './PhotoDialog.module.css'
import instance from '../../instance'
import { useEffect } from 'react';
import { useState } from 'react';





const PhotoDialog = (props) => {    
    const { isDialogOpen, setDialogOpen, setPhotoInfo, photoId} = props
    const { register, handleSubmit, formState: { errors } } = useForm()
    const [photo, setPhoto] = useState()


    // const getBiteSize = async() => {
    //     try {
    //         const response = await instance.get('/biteSize')
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }

    const getPhoto = async() => {
        try {
			if (photoId) {
				const response = await instance.get(`/image/${photoId}`)
			}
        } catch (error) {
            console.log(error)
        }
    }

    const onSubmitHandler = (data) => {
        data.id = photoId
        setPhotoInfo(data)
        // console.log(data)
        // getBiteSize()
    }

    const handleClose = () => {
        setDialogOpen(false);
    };

    useEffect(()=> {
        getPhoto()
    },[])


    return(
        <Dialog
            onClose={handleClose}
            aria-labelledby="simple-dialog-title"
            maxWidth='xl'
            open={isDialogOpen}
        >
            <DialogContent className={styles.dialog}>
                <img alt='img' className={styles.img} src={`${photo}`}/>
                
                <form className={styles.form} onSubmit={handleSubmit(onSubmitHandler)}>
                    <div className={styles.inputs}>
                        <TextField
                            className={styles.input}
                            
                            {...register('width', { required: 'Это обязательное поле' })} 
                            helperText={errors.width?.message || ''}
                            error={!!errors.width?.message}
                            autoComplete="off"
                            variant="standard"
                            label="Ширина"
                            type="number"
                        />

                        <TextField
                            className={styles.input}                            
                            {...register('height', { required: 'Это обязательное поле' })}
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