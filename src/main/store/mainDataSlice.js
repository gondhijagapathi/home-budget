import { createSlice } from '@reduxjs/toolkit'

export const mainDataSlice = createSlice({
  name: 'mainData',
  initialState: {
    addDialogOpen: false,
    categories: [],
    subCategories: [],
    items: [],
    measures: [],
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
    }
  }
})

// Action creators are generated for each case reducer function
export const { addDialogOpen, addDialogClose, addCategories, addItems, addSubCategories, addMeasures } = mainDataSlice.actions

export default mainDataSlice.reducer