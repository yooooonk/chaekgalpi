import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const ROUTES = ['/save', '/list', '/search', '/categories']
const THRESHOLD = 60

export function useSwipeNav(ref: React.RefObject<HTMLElement | null>) {
  const navigate = useNavigate()
  const location = useLocation()
  // 클로저 stale 방지: 최신 pathname을 ref로 유지
  const pathRef = useRef(location.pathname)
  useEffect(() => { pathRef.current = location.pathname }, [location.pathname])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let startX = 0, startY = 0, active = false

    function tryNav(endX: number, endY: number) {
      const dx = endX - startX
      const dy = endY - startY
      if (Math.abs(dx) < THRESHOLD || Math.abs(dx) < Math.abs(dy)) return
      const idx = ROUTES.indexOf(pathRef.current)
      if (idx === -1) return
      if (dx < 0 && idx < ROUTES.length - 1) navigate(ROUTES[idx + 1])
      else if (dx > 0 && idx > 0) navigate(ROUTES[idx - 1])
    }

    // ── 터치 (모바일) ──
    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      active = true
    }
    function onTouchMove(e: TouchEvent) {
      if (!active) return
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      // 수평 스와이프가 확실할 때만 스크롤 막기
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15) e.preventDefault()
    }
    function onTouchEnd(e: TouchEvent) {
      if (!active) return
      active = false
      tryNav(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
    }

    // ── 포인터 (데스크탑 마우스) ──
    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === 'touch') return
      el.setPointerCapture(e.pointerId) // 영역 밖에서 mouseup 해도 감지
      startX = e.clientX
      startY = e.clientY
      active = true
    }
    function onPointerUp(e: PointerEvent) {
      if (e.pointerType === 'touch' || !active) return
      active = false
      tryNav(e.clientX, e.clientY)
    }
    function onPointerCancel() { active = false }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [navigate, ref])
}
