import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#0b5cff'
    },
    secondary: {
      main: '#00b37e'
    },
    background: {
      default: '#f4f6fb'
    }
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(',')
  }
})

export default theme
