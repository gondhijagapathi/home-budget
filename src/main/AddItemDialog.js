import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { addDialogClose, addSpendings } from './store/mainDataSlice';
import { useDispatch } from 'react-redux'
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Alert from '@mui/material/Alert';
import { useSelector } from 'react-redux'
import { getSubCategories } from './api/apiCaller';
import moment from 'moment/moment';
import uuid from 'react-uuid'

export default function AddItemDialog({ isOpen }) {

    const dispatch = useDispatch()
    const categories = useSelector(state => state.mainData.categories)
    const users = useSelector(state => state.mainData.users)
    const [categoryMenuItems, setCategoryMenuItems] = React.useState([])
    const [userItems, setUserItems] = React.useState([])
    const subCategories = useSelector(state => state.mainData.subCategories)
    const [subCategoryMenuItems, setSubCategoryMenuItems] = React.useState([])
    const [selectedUser, setSelectedUser] = React.useState("")
    const [selectedCategory, setSelectedCategory] = React.useState("")
    const [selectedSubCategory, setSelectedSubCategory] = React.useState("")
    const [selectedPrice, setSelectedPrice] = React.useState("")
    const [status, setStatus] = React.useState({
        message: "",
        type: "error",
        visible: false
    })

    const handleClose = () => {
        clear();
        dispatch(addDialogClose())
    };

    const isEmpty = (str) => {
        return (!str || /^\s*$/.test(str));
    }
    const addAnother = () => {
        if (validateData()) {
            addThisItem();
            clear();
        }
    };

    const clear = () => {
        setSelectedCategory("")
        setSelectedSubCategory("")
        setSelectedPrice("")
    }

    const validateData = () => {
        if (isEmpty(selectedCategory) || isEmpty(selectedSubCategory) || isEmpty(selectedPrice)) {
            setStatus(status => ({ visible: true, type: "error", message: "All fields are required" }))
            return false;
        } else {
            setStatus(status => ({ ...status, visible: false }))
            return true;
        }
    };

    const addThisItem = () => {
        const postData = [
            uuid(),
            selectedCategory,
            selectedSubCategory,
            selectedUser,
            parseFloat(selectedPrice),
            moment().format("yyyy-MM-DD HH:mm:ss"),
        ]
        dispatch(addSpendings(postData));
    };

    const addAndClose = () => {
        if (validateData()) {
            addThisItem();
            clear();
            dispatch(addDialogClose())
        }
    };

    React.useEffect(() => {
        users.forEach((user) => {
            setUserItems(userItems => [...userItems, <MenuItem key={user.personId} value={user.personId}>{user.userName}</MenuItem>])
        })
    }, [users]);

    React.useEffect(() => {
        setCategoryMenuItems([])
        setSubCategoryMenuItems([])
        categories.forEach((cat) => {
            setCategoryMenuItems(categoryMenuItems => [...categoryMenuItems, <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</MenuItem>])
        })
    }, [categories]);

    React.useEffect(() => {
        setSubCategoryMenuItems([])
        subCategories.forEach((sub) => {
            setSubCategoryMenuItems(subCategoryMenuItems => [...subCategoryMenuItems, <MenuItem key={sub.subCategoryId} value={sub.subCategoryId}>{sub.subCategoryName}</MenuItem>])
        })
    }, [subCategories]);

    function onCategoryChange(event) {
        setSelectedCategory(event.target.value)
        getSubCategories(event.target.value)
    }

    function onUserChange(event) {
        setSelectedUser(event.target.value)
    }

    function onSubCategoryChange(event) {
        setSelectedSubCategory(event.target.value)
    }

    return (
        <Dialog open={isOpen} onClose={handleClose}>
            <DialogTitle>Add Items</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please Add Items Properly, so that budget for this house can be calculated
                </DialogContentText>
                {status.visible && <Alert severity={status.type}>{status.message}</Alert>}
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <InputLabel id="users-label">Users</InputLabel>
                    <Select
                        labelId="users-label"
                        id="users"
                        label="Users"
                        value={selectedUser}
                        onChange={onUserChange}
                    >
                        {userItems}
                    </Select>
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                        labelId="category-label"
                        id="category"
                        label="Category"
                        value={selectedCategory}
                        onChange={onCategoryChange}
                    >
                        {categoryMenuItems}
                    </Select>
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <InputLabel id="subCategory-label">Sub Category</InputLabel>
                    <Select
                        labelId="subCategory-label"
                        id="subCategory"
                        label="Sub Category"
                        value={selectedSubCategory}
                        onChange={onSubCategoryChange}
                    >
                        {subCategoryMenuItems}
                    </Select>
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <TextField type={"number"} id="Amount" label="Amount" variant="standard" value={selectedPrice} onChange={(event) => { setSelectedPrice(event.target.value) }} />
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={addAnother}>Add Another</Button>
                <Button onClick={addAndClose}>Add Item and Close</Button>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
