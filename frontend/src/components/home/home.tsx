import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { HeroBanner } from '../hero/hero-banner'
import { ReviewsSection } from './reviews-section'
import * as branchService from '@/services/branchService'
import type { Branch } from '@/types/branch'
import { MapPin } from 'lucide-react'

export const Home = () => {
  const navigate = useNavigate()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    branchService.getAll()
      .then(setBranches)
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 pb-20">
      <HeroBanner />

      <div className="px-8 mt-4">
        <h2 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">
          Danh sách chi nhánh
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-sm text-gray-500">Đang tải danh sách chi nhánh...</p>
        </div>
      ) : branches.length > 0 ? (
        <motion.div
          className="mx-auto grid w-full grid-cols-1 gap-5 px-8 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onClick={() => navigate(`/phong-nghi?branchId=${branch.id}`)}
            />
          ))}
        </motion.div>
      ) : (
        <div className="flex justify-center py-12">
          <p className="text-sm text-gray-500">Chưa có chi nhánh nào</p>
        </div>
      )}

      <ReviewsSection />
    </div>
  )
}

import type { Variants } from 'framer-motion'

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

/** Card chi nhánh — hiển thị ảnh collage, tên, địa chỉ */
function BranchCard({ branch, onClick }: { branch: Branch; onClick: () => void }) {
  const images = (branch.images || []).map(branchService.imageUrl)
  const img = (i: number) => images[i] || images[0] || '/images/placeholder-room.png'
  const hasImages = images.length > 0

  return (
    <motion.div
      variants={cardVariants}
      onClick={onClick}
      className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer"
    >
      {/* Image area */}
      {hasImages ? (
        <div className="flex h-[200px] gap-2">
          <div className="relative flex-[5] overflow-hidden rounded-xl">
            <img src={img(0)} alt={branch.name} className="h-full w-full object-cover" loading="lazy" />
          </div>
          {images.length > 1 && (
            <div className="relative flex-[3] overflow-hidden rounded-xl">
              <img src={img(1)} alt={branch.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
          )}
          {images.length > 2 && (
            <div className="flex flex-[2] flex-col gap-2">
              {[2, 3, 4].map((i) => images[i] ? (
                <div key={i} className="relative flex-1 overflow-hidden rounded-xl">
                  <img src={img(i)} alt={`${branch.name} ${i}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                </div>
              ) : null)}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-xl bg-gray-100">
          <MapPin className="size-12 text-gray-300" />
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col gap-0.5 px-1 pb-1">
        <h3 className="text-[17px] font-extrabold text-[#2B2B2B]">{branch.name}</h3>
        <p className="text-[13px] font-semibold text-[#6A635B]">{branch.address}</p>
      </div>
    </motion.div>
  )
}
