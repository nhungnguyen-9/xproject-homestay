import { useParams } from 'react-router'
import { CustomerDetail } from './customer-detail'

export default function CustomerDetailRoute() {
  const { id } = useParams<{ id: string }>()
  return <CustomerDetail key={id} />
}
