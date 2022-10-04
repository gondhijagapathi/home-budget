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
import { getItems, getSubCategories } from './api/apiCaller';
import moment from 'moment/moment';

export default function AddItemDialog({ isOpen }) {

    const dispatch = useDispatch()
    const categories = useSelector(state => state.mainData.categories)
    const shops = useSelector(state => state.mainData.shops)
    const users = useSelector(state => state.mainData.users)
    const [categoryMenuItems, setCategoryMenuItems] = React.useState([])
    const measures = useSelector(state => state.mainData.measures)
    const [measureMenuItems, setMeasureMenuItems] = React.useState([])
    const subCategories = useSelector(state => state.mainData.subCategories)
    const [subCategoryMenuItems, setSubCategoryMenuItems] = React.useState([])
    const items = useSelector(state => state.mainData.items)
    const [itemsMenuItems, setItemsMenuItems] = React.useState([])
    const [selectedCategory, setSelectedCategory] = React.useState("")
    const [selectedSubCategory, setSelectedSubCategory] = React.useState("")
    const [selectedMeasure, setSelectedMeasure] = React.useState("")
    const [selectedItem, setSelectedItem] = React.useState("")
    const [selectedQuantity, setSelectedQuantity] = React.useState("")
    const [selectedPrice, setSelectedPrice] = React.useState("")
    const [status, setStatus] = React.useState({
        message:"",
        type:"error",
        visible:false
    })

    const handleClose = () => {
        console.log(selectedCategory+" "+selectedSubCategory+" "+selectedMeasure+" "+selectedItem+" "+selectedQuantity+" "+selectedPrice)
        dispatch(addDialogClose())
    };

    const isEmpty = (str) => {
        return (!str || /^\s*$/.test(str));
    }
    const addAnother = () => {
        if (validateData()) {
            addThisItem();
        }
    };

    const validateData = () => {
        if (isEmpty(selectedCategory) || isEmpty(selectedSubCategory) ||isEmpty(selectedMeasure) ||isEmpty(selectedItem) ||isEmpty(selectedQuantity) ||isEmpty(selectedPrice)){
            setStatus(status => ({visible:true,type:"error",message:"All fields are required"}))
            return false;
        } else {
            setStatus(status => ({...status,visible:false}))
            return true;
        } 
    };

    const addThisItem = () => {
        const postData = [
            1234,shops[0].shopId,selectedCategory,selectedSubCategory,selectedItem,users[0].personId,selectedQuantity,selectedPrice,selectedMeasure,moment().format("yyyy-MM-DD HH:mm:ss")
        ]
        dispatch(addSpendings(postData));
    };

    const addAndClose = () => {
        if (validateData()) {
            addThisItem();
            dispatch(addDialogClose())
        }
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
        setSelectedCategory(event.target.value)
        getSubCategories(event.target.value)
    }

    function onSubCategoryChange(event) {
        setSelectedSubCategory(event.target.value)
        getItems(event.target.value)
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
                    <InputLabel id="items-label">Items</InputLabel>
                    <Select
                        labelId="items-label"
                        id="items"
                        label="Items"
                        value={selectedItem}
                        onChange={(event)=> { setSelectedItem(event.target.value) }}
                    >
                        {itemsMenuItems}
                    </Select>
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <TextField type={"number"} id="Qantity" label="Qantity" variant="standard" onChange={(event)=> { setSelectedQuantity(event.target.value) }}/>
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <InputLabel id="quantity-type-label">Measurement</InputLabel>
                    <Select
                        labelId="quantity-type-label"
                        id="quantity-type"
                        label="Measurement"
                        value={selectedMeasure}
                        onChange={(event)=> { setSelectedMeasure(event.target.value) }}
                    >
                        {measureMenuItems}
                    </Select>
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, minWidth: '100%' }}>
                    <TextField type={"number"} id="Price" label="Price" variant="standard" onChange={(event)=> { setSelectedPrice(event.target.value) }}/>
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
