import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import ListItemIcon from '@mui/material/ListItemIcon';
import ScaleIcon from '@mui/icons-material/Scale';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { useSelector } from 'react-redux';

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
            addListOfItems([...listOfItems, <><ListItem alignItems="flex-start">
            <ListItemAvatar>
                <Avatar alt="Remy Sharp" src="https://www.shareicon.net/data/512x512/2016/05/05/760099_food_512x512.png" />
            </ListItemAvatar>
            <ListItemText
                primary={findItemName(spend[4])}
                style={{ color: 'white' }}
                secondary={
                    <React.Fragment>
                        <List dense={false}>
                            <ListItem>
                                <ListItemIcon>
                                    <ScaleIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={spend[6]+" "+findMeasureName(spend[8])}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <CurrencyRupeeIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={spend[7]}
                                />
                            </ListItem>
                        </List>
                    </React.Fragment>
                }
            />
        </ListItem><Divider variant="inset" component="li" /></>])
        });
    },[spendings]);

    return (
        <List sx={{ width: '100%', height: 'calc(100vh - 72px)', bgcolor: 'background.paper' }}>
            {listOfItems}
        </List>
    );
}
