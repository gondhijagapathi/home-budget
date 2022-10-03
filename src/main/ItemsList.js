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

export default function ItemsList() {
    return (
        <List sx={{ width: '100%', height: 'calc(100vh - 72px)', bgcolor: 'background.paper' }}>
            <ListItem alignItems="flex-start">
                <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src="/static/images/avatar/1.jpg" />
                </ListItemAvatar>
                <ListItemText
                    primary="Carrot"
                    style={{ color: 'white' }}
                    secondary={
                        <React.Fragment>
                            <List dense={false}>
                                <ListItem>
                                    <ListItemIcon>
                                        <ScaleIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Single-line item"
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <CurrencyRupeeIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Single-line item"
                                    />
                                </ListItem>
                            </List>
                        </React.Fragment>
                    }
                />
            </ListItem>
            <Divider variant="inset" component="li" />
        </List>
    );
}
