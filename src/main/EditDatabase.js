import { Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { getCategories, getSubCategories, postData } from './api/apiCaller';
import { addAlert } from './store/mainDataSlice';

function EditDatabase() {
    const dispatch = useDispatch();
    const subCategories = useSelector(state => state.mainData.allSubCategories);
    const categories = useSelector(state => state.mainData.categories);

    const [selectedCategory, setSelectedCategory] = React.useState("")
    const [selectedSubCategory, setSelectedSubCategory] = React.useState("")
    const [selectedItem, setSelectedItem] = React.useState("")
    const [categoryMenuItems, setCategoryMenuItems] = React.useState([]);
    const [subCategoryMenuItems, setSubCategoryMenuItems] = React.useState([]);

    const [categoryText, setCategoryText] = React.useState("")
    const [subCategoryText, setSubCategoryText] = React.useState("")


    function onCategoryChange(event) {
        setSelectedCategory(event.target.value)
    }

    function onSubCategoryChange(event) {
        setSelectedSubCategory(event.target.value)
    }

    React.useEffect(() => {
        categories.forEach((cat) => {
            setCategoryMenuItems(categoryMenuItems => [...categoryMenuItems, <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</MenuItem>])
        })
    }, [categories]);

    React.useEffect(() => {
        subCategories.forEach((sub) => {
            setSubCategoryMenuItems(subCategoryMenuItems => [...subCategoryMenuItems, <MenuItem key={sub.subCategoryId} value={sub.subCategoryId}>{sub.subCategoryName}</MenuItem>])
        })
    }, [subCategories]);

    React.useEffect(() => {
        getSubCategories(0);
    }, []);

    const addCategory = async () => {
        if (categoryText) {
            const status = await postData('categories', {
                categoryName: categoryText
            }, true);
            if (status === '204') {
                dispatch(addAlert({
                    open: true,
                    message: "Category added Succesfully",
                    type: "success",
                }));
                getCategories();
            } else {
                dispatch(addAlert({
                    open: true,
                    message: "Category add failed",
                    type: "error",
                }));
            }
        }
    };

    const addSubCategory = async () => {
        if (selectedCategory && subCategoryText) {
            const status = await postData('subCategories/'+selectedCategory, {
                categoryId: selectedCategory,
                subCategoryName: subCategoryText,
            }, true);
            if (status === '204') {
                dispatch(addAlert({
                    open: true,
                    message: "SubCategory added Succesfully",
                    type: "success",
                }));
                getSubCategories(0);
            } else {
                dispatch(addAlert({
                    open: true,
                    message: "SubCategory add failed",
                    type: "error",
                }));
            }
        }
    };

    const addItem = async () => {
        if (selectedSubCategory && selectedItem) {
            const status = await postData('items/'+selectedSubCategory, {
                subCategoryId: selectedSubCategory,
                itemName: selectedItem,
            }, true);
            if (status === '204') {
                dispatch(addAlert({
                    open: true,
                    message: "item added Succesfully",
                    type: "success",
                }));
            } else {
                dispatch(addAlert({
                    open: true,
                    message: "item add failed",
                    type: "error",
                }));
            }
        }
    };

    return (
        <>
            <Stack spacing={2} alignItems="center" sx={{ paddingTop: '30px' }}>
                <TextField id="cate" sx={{ width: '70%' }} label="Add Category" variant="standard" value={categoryText}
                    onChange={(event) => { setCategoryText(event.target.value) }} />
                <Button variant="outlined" sx={{ width: '70%' }} onClick={addCategory}>Add Category</Button>
            </Stack>
            <Stack spacing={2} alignItems="center" sx={{ paddingTop: '30px' }}>
                <Stack spacing={2} alignItems="center" direction={'row'} sx={{ width: '70%' }}>
                    <FormControl variant="standard" sx={{ width: '100%' }}>
                        <InputLabel id="category-label">Category</InputLabel>
                        <Select
                            labelId="category-label"
                            id="category"
                            label="Category"
                            sx={{ width: '100%' }}
                            value={selectedCategory}
                            onChange={onCategoryChange}
                        >
                            {categoryMenuItems}
                        </Select>
                    </FormControl>
                    <TextField sx={{ width: '100%' }} label="Add SubCategory" variant="standard" value={subCategoryText} onChange={(event) => { setSubCategoryText(event.target.value) }} />
                </Stack>
                <Button variant="outlined" sx={{ width: '70%' }} onClick={() => { addSubCategory(); }}>Add SubCategory</Button>
            </Stack>
            <Stack spacing={2} alignItems="center" sx={{ paddingTop: '30px' }}>
                <Stack spacing={2} alignItems="center" direction={'row'} sx={{ width: '70%' }}>
                    <FormControl variant="standard" sx={{ width: '100%' }}>
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
                    <TextField sx={{ width: '100%' }} label="Add Item" variant="standard" value={selectedItem} onChange={(event) => { setSelectedItem(event.target.value) }} />
                </Stack>
                <Button variant="outlined" sx={{ width: '70%' }} onClick={() => { addItem(); }}>Add Item</Button>
            </Stack>
        </>
    );
}

export default EditDatabase;