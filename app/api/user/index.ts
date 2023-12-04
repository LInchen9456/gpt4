import request from '../../utils/request/axios'


export function login(data: any) {
  return request.post('/charGtplogin', data)
}