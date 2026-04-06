import { useParams } from 'react-router'
import { CustomerDetail } from './customer-detail'

/**
 * Route wrapper cho trang chi tiết khách hàng — dùng key={id} để reset state khi đổi khách
 */
export default function CustomerDetailRoute() {
  const { id } = useParams<{ id: string }>()
  return <CustomerDetail key={id} />
}
