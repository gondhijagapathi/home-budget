import * as React from 'react';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { Paper } from '@mui/material';
import { addDialogOpen } from './store/mainDataSlice';
import { useDispatch } from 'react-redux'

const actions = [
    { icon: <AddIcon />, name: 'Add', actionName: 'add' },
    { icon: <SaveIcon />, name: 'Save', actionName: 'save' }
];

export default function AddItem() {

    const dispatch = useDispatch()

    function navAction(action) {
        if (action === 'add') {
            dispatch(addDialogOpen())
        }
    }

    return (
        <>
        <Paper sx={{ position: 'fixed', bottom: 50, left: 0, right: 0 }} elevation={3}>
            <SpeedDial
                ariaLabel="Add budget item"
                sx={{ position: 'absolute', bottom: 16, right: 16 }}
                icon={<SpeedDialIcon />}
            >
                {actions.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                        onClick={() => { navAction(action.actionName) }}
                    />
                ))}
            </SpeedDial>
        </Paper>
        </>
    );
}
