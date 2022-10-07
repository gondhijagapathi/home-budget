import { createSlice } from '@reduxjs/toolkit'

export const mainDataSlice = createSlice({
  name: 'mainData',
  initialState: {
    addDialogOpen: false,
    categories: [],
    subCategories: [],
    allSubCategories: [],
    items: [],
    allItems: [],
    measures: [],
    spendings: [],
    shops: [],
    users: [],
    recentSpendings: [],
    tabView: "add",
    alert: {
      open: false,
      message: "",
      type: "",
    },
  },
  reducers: {
    addDialogOpen: state => {
      state.addDialogOpen = true
    },
    addDialogClose: state => {
      state.addDialogOpen = false
    },
    changeTab: (state, action) => {
      state.tabView = action.payload
    },
    addCategories: (state, action) => {
      state.categories = action.payload
    },
    addSubCategories: (state, action) => {
      state.subCategories = action.payload
    },
    addAllSubCategories: (state, action) => {
      state.allSubCategories = action.payload
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
    addRecentSpendings: (state, action) => {
      state.recentSpendings = action.payload
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
    addAlert: (state, action) => {
      state.alert.open = action.payload.open
      state.alert.message = action.payload.message;
      state.alert.type = action.payload.type;
    },
  }
})

// Action creators are generated for each case reducer function
export const { addDialogOpen, addDialogClose, addCategories, addItems, addSubCategories, addMeasures,
  addSpendings, addShops, addUsers, clearSpendings, removeSpendings, addAllItems, addRecentSpendings, changeTab, addAllSubCategories, addAlert } = mainDataSlice.actions

export default mainDataSlice.reducer