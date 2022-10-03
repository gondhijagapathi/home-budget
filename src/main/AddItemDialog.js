import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { addDialogOpen, addDialogClose } from './store/mainDataSlice';
import { useDispatch } from 'react-redux'
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Alert from '@mui/material/Alert';
import { useSelector } from 'react-redux'
import { getItems, getSubCategories } from './api/apiCaller';

export default function AddItemDialog({ isOpen }) {

    const dispatch = useDispatch()
    const categories = useSelector(state => state.mainData.categories)
    const [categoryMenuItems, setCategoryMenuItems] = React.useState([])
    const measures = useSelector(state => state.mainData.measures)
    const [measureMenuItems, setMeasureMenuItems] = React.useState([])
    const subCategories = useSelector(state => state.mainData.subCategories)
    const [subCategoryMenuItems, setSubCategoryMenuItems] = React.useState([])
    const items = useSelector(state => state.mainData.items)
    const [itemsMenuItems, setItemsMenuItems] = React.useState([])

    const handleClickOpen = () => {
        dispatch(addDialogOpen())
    };

    const handleClose = () => {
        dispatch(addDialogClose())
    };

    React.useEffect(() => {
        setCategoryMenuItems([])
        setSubCategoryMenuItems([])
        setItemsMenuItems([])
        categories.forEach((cat) => {
            setCategoryMenuItems(categoryMenuItems => [...categoryMenuItems, <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</MenuItem>])
        })
    }, [categories]);

    React.useEffect(() => {
        setMeasureMenuItems([])
        measures.forEach((mes) => {
            setMeasureMenuItems(measureMenuItems => [...measureMenuItems, <MenuItem key={mes.measureId} value={mes.measureId}>{mes.measure}</MenuItem>])
        })
    }, [measures]);

    React.useEffect(() => {
        setSubCategoryMenuItems([])
        setItemsMenuItems([])
        subCategories.forEach((sub) => {
            setSubCategoryMenuItems(subCategoryMenuItems => [...subCategoryMenuItems, <MenuItem key={sub.subCategoryId} value={sub.subCategoryId}>{sub.subCategoryName}</MenuItem>])
        })
    }, [subCategories]);

    React.useEffect(() => {
        setItemsMenuItems([])
        items.forEach((it) => {
            setItemsMenuItems(itemsMenuItems => [...itemsMenuItems, <MenuItem key={it.itemId} value={it.itemId}>{it.itemName}</MenuItem>])
        })
    }, [items]);

    function onCategoryChange(event) {
        getSubCategories(event.target.value)
    }

    function onSubCategoryChange(event) {
        getItems(event.target.value)
    }

    return (
        <Dialog open={isOpen} onClose={handleClose}>
            <DialogTitle>Add Items</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please Add Items Properly, so that budget for this house can be calculated
                </DialogContentText>
                <Alert severity="success">This is a success alert — check it out!</Alert>
                <Alert severity="error">This is a success alert — check it out!</Alert>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                        labelId="category-label"
                        id="category"
                        label="Category"
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
                        onChange={onSubCategoryChange}
                    >
                        {subCategoryMenuItems}
                    </Select>
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <InputLabel id="items-label">Items</InputLabel>
                    <Select
                        labelId="items-label"
                        id="items"
                        label="Items"
                    >
                        {itemsMenuItems}
                    </Select>
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <TextField id="Qantity" label="Qantity" variant="standard" />
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <InputLabel id="quantity-type-label">Measurement</InputLabel>
                    <Select
                        labelId="quantity-type-label"
                        id="quantity-type"
                        label="Measurement"
                    >
                        {measureMenuItems}
                    </Select>
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <TextField id="Price" label="Price" variant="standard" />
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Add Another</Button>
                <Button onClick={handleClose}>Add Item and Close</Button>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
