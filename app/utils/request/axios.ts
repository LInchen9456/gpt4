import axios, { type AxiosResponse } from 'axios'

const service = axios.create({
  baseURL: process.env.BASE_URL,
})

service.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem("token")
    if (token){
      config.headers.Authorization = `Bearer ${token}`
    }
    // console.log(config)
    return config
  },
  (error) => {
    return Promise.reject(error.response)
  },
)

service.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    if (response.status === 200)
      return response

    throw new Error(response.status.toString())
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default service
