import { CarDetailView } from "@/components/car-detail-view"

export default function CarDetailPage({ params }: { params: { id: string } }) {
  return <CarDetailView carId={params.id} />
}
