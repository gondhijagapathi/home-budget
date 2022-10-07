import * as React from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { addAlert } from './store/mainDataSlice';

function AlertSnack() {

    const dispatch = useDispatch();
    const message = useSelector(state => state.mainData.alert.message)
    const type = useSelector(state => state.mainData.alert.type)
    const open = useSelector(state => state.mainData.alert.open)

    const onclose = () => {
        dispatch(addAlert({
            open: false,
        }));
    };

    return (
        <Snackbar open={open} autoHideDuration={3000} onClose={onclose}>
            <Alert onClose={onclose} severity={type} sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
}

export default AlertSnack;
