import { configureStore } from '@reduxjs/toolkit'
import mainDataSlice from './mainDataSlice'

export default configureStore({
  reducer: {
    mainData: mainDataSlice
  },
  devTools: true
})