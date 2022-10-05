import { createSlice } from '@reduxjs/toolkit'

export const mainDataSlice = createSlice({
  name: 'mainData',
  initialState: {
    addDialogOpen: false,
    categories: [],
    subCategories: [],
    items: [],
    allItems: [],
    measures: [],
    spendings: [],
    shops: [],
    users: [],
  },
  reducers: {
    addDialogOpen: state => {
      state.addDialogOpen = true
    },
    addDialogClose: state => {
      state.addDialogOpen = false
    },
    addCategories: (state, action) => {
      state.categories = action.payload
    },
    addSubCategories: (state, action) => {
      state.subCategories = action.payload
    },
    addItems: (state, action) => {
      state.items = action.payload
    },
    addMeasures: (state, action) => {
      state.measures = action.payload
    },
    addSpendings: (state, action) => {
      state.spendings = [...state.spendings, action.payload]
    },
    clearSpendings: state => {
      state.spendings = []
    },
    removeSpendings: (state, action) => {
      state.spendings = state.spendings.filter(spend => spend[0] !== action.payload)
    },
    addShops: (state, action) => {
      state.shops = action.payload
    },
    addUsers: (state, action) => {
      state.users = action.payload
    },
    addAllItems: (state, action) => {
      state.allItems = action.payload
    },
  }
})

// Action creators are generated for each case reducer function
export const { addDialogOpen, addDialogClose, addCategories, addItems, addSubCategories, addMeasures,
  addSpendings, addShops, addUsers, clearSpendings, removeSpendings, addAllItems } = mainDataSlice.actions

export default mainDataSlice.reducer