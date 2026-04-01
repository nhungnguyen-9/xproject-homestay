/** Thông tin chi nhánh homestay */
export type LocationBranch = {
  id: number
  name: string
  phone: string
  address: string
  district: string
}

/** Danh sách các chi nhánh homestay */
export const locationBranches: LocationBranch[] = [
  { id: 1, name: "Cần Thơ", phone: "08xxxxxxxx", address: "08/245 Cần Thơ", district: "Quận Ninh Kiều" },
  { id: 2, name: "TP. Hồ Chí Minh", phone: "08xxxxxxxx", address: "08/245 Hồ Chí Minh", district: "Quận 1" },
]
