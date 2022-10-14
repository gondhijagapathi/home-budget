import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import DeleteIcon from '@mui/icons-material/Delete'
import DateRangeIcon from '@mui/icons-material/DateRange';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { useSelector } from 'react-redux';
import { Grid, IconButton, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { deleteSpending, getRecentSpendings } from './api/apiCaller';


function RecentItemView({ spend, itemName }) {
    async function deleteSpend(id) {
        const res = await deleteSpending(id);
        if (res === '204') {
            getRecentSpendings();
        }
    }

    return (
        <>
            <ListItem alignItems="flex-start" secondaryAction={
                <IconButton edge="end" aria-label="Delete" onClick={() => { deleteSpend(spend.spendingId) }}>
                    <DeleteIcon />
                </IconButton>
            }>
                <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src="https://www.shareicon.net/data/512x512/2016/05/05/760099_food_512x512.png" />
                </ListItemAvatar>
                <ListItemText
                    primary={itemName}
                    disableTypography

                    style={{ color: 'white' }}
                    secondary={
                        <React.Fragment>
                            <Grid container sx={{ marginTop: '3px' }} spacing={2}>
                                <Grid item>
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <CurrencyRupeeIcon />
                                        <Typography variant="body1">{spend.amount}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item>
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <DateRangeIcon />
                                        <Typography variant="body1">{spend.dateOfSpending}</Typography>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </React.Fragment>
                    }
                />
            </ListItem><Divider variant="inset" component="li" />
        </>
    );
}

function Recents() {
    const [listOfItems, addListOfItems] = React.useState([])

    const recentSpendings = useSelector(state => state.mainData.recentSpendings)

    React.useEffect(() => {
        var list = [];
        recentSpendings.forEach((spend) => {
            list = [...list, <RecentItemView spend={spend} itemName={spend.subCategoryName} />]
        });
        addListOfItems(list)
        // eslint-disable-next-line
    }, [recentSpendings]);

    return (
        <List sx={{ width: '100%', minHeight: '100%', height: '100%', bgcolor: 'background.paper', paddingBottom: '72px' }}>
            {listOfItems}
        </List>
    );
}

export default Recents;
