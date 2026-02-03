import { createSlice } from '@reduxjs/toolkit'

export const mainDataSlice = createSlice({
  name: 'mainData',
  initialState: {
    addDialogOpen: false,
    categories: [],
    subCategories: [],
    allSubCategories: [],
    incomeSources: [],
    spendings: [],
    users: [],
    recentSpendings: [],
    tabView: "add",
    alert: {
      open: false,
      message: "",
      type: "error",
    },
    lastUpdated: null, // Timestamp to trigger updates
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
    addIncomeSources: (state, action) => {
      state.incomeSources = action.payload
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
    addUsers: (state, action) => {
      state.users = action.payload
    },
    addAlert: (state, action) => {
      state.alert.open = action.payload.open
      state.alert.message = action.payload.message;
      state.alert.type = action.payload.type;
    },
    invalidateData: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
    // resetDataInvalidated removed as distinct values handle the trigger
  }
})

// Action creators are generated for each case reducer function
export const { addDialogOpen, addDialogClose, addCategories, addSubCategories,
  addSpendings, addUsers, clearSpendings, removeSpendings, addRecentSpendings, changeTab, addAllSubCategories, addAlert, invalidateData, resetDataInvalidated, addIncomeSources } = mainDataSlice.actions

export default mainDataSlice.reducer