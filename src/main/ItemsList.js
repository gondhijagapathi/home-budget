import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import ScaleIcon from '@mui/icons-material/Scale';
import DeleteIcon from '@mui/icons-material/Delete'
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { useSelector } from 'react-redux';
import { Grid, IconButton, Typography } from '@mui/material';
import { Stack } from '@mui/system';

export default function ItemsList() {
    const [listOfItems, addListOfItems] = React.useState([])
    const spendings = useSelector(state => state.mainData.spendings)
    const items = useSelector(state => state.mainData.items)
    const measures = useSelector(state => state.mainData.measures)

    const findItemName = (id) => {
        return items.find(item => item.itemId === id)?.itemName
    };

    const findMeasureName = (id) => {
        return measures.find(measure => measure.measureId === id)?.measure
    };

    React.useEffect(() => {
        addListOfItems([]);
        spendings.forEach((spend) => {
            addListOfItems([...listOfItems, <>
                <ListItem alignItems="flex-start" secondaryAction={
                    <IconButton edge="end" aria-label="comments">
                        <DeleteIcon />
                    </IconButton>
                }>
                    <ListItemAvatar>
                        <Avatar alt="Remy Sharp" src="https://www.shareicon.net/data/512x512/2016/05/05/760099_food_512x512.png" />
                    </ListItemAvatar>
                    <ListItemText
                        primary={findItemName(spend[4])}
                        disableTypography

                        style={{ color: 'white' }}
                        secondary={
                            <React.Fragment>
                                <Grid container sx={{ marginTop: '3px' }} spacing={2}>
                                    <Grid item>
                                        <Stack direction="row" alignItems="center" gap={1}>
                                            <ScaleIcon />
                                            <Typography variant="body1">{spend[6] + " " + findMeasureName(spend[8])}</Typography>
                                        </Stack>
                                    </Grid>
                                    <Grid item>
                                        <Stack direction="row" alignItems="center" gap={1}>
                                            <CurrencyRupeeIcon />
                                            <Typography variant="body1">{spend[7]}</Typography>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </React.Fragment>
                        }
                    />
                </ListItem><Divider variant="inset" component="li" /></>])
        });
        // eslint-disable-next-line
    }, [spendings]);

    return (
        <List sx={{ width: '100%', minHeight: '100%', height:'100%', bgcolor: 'background.paper', paddingBottom:'72px'}}>
            {listOfItems}
        </List>
    );
}
