export type LocationBranch = {
  id: number
  name: string
  phone: string
  address: string
  district: string
}

export const locationBranches: LocationBranch[] = [
  { id: 1, name: "Cần Thơ", phone: "08xxxxxxxx", address: "08/245 Cần Thơ", district: "Quận Ninh Kiều" },
  { id: 2, name: "TP. Hồ Chí Minh", phone: "08xxxxxxxx", address: "08/245 Hồ Chí Minh", district: "Quận 1" },
  // { name: "Vĩnh Long", phone: "08xxxxxxxx", address: "08/245 Vĩnh Long", district: "TP. Vĩnh Long" },
  // { name: "An Giang", phone: "08xxxxxxxx", address: "08/243 An Giang", district: "TP. Long Xuyên" },
  // { name: "Hà Nội", phone: "08xxxxxxxx", address: "08/101 Hà Nội", district: "Quận Hoàn Kiếm" },
  // { name: "Đà Nẵng", phone: "08xxxxxxxx", address: "08/200 Đà Nẵng", district: "Sơn Trà" },
]
