/**
 * VeloHub V3 — Carrossel Destaques (Home)
 * VERSION: v1.0.2 | DATE: 2026-05-27 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.2: Autoplay 6s; timer reinicia após troca manual
 * - v1.0.1: Slides via hub_banner (campo id nos dots)
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { homeDestaquesAPI } from '../../services/api';

const AUTOPLAY_MS = 6000;

const HomeDestaquesCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await homeDestaquesAPI.getCarousel();
        const list = data?.slides || [];
        if (!cancelled) {
          setSlides(list);
          setIndex(0);
        }
      } catch (err) {
        console.error('HomeDestaquesCarousel:', err);
        if (!cancelled) {
          setSlides([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const goPrev = useCallback(() => {
    if (slides.length === 0) return;
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goNext = useCallback(() => {
    if (slides.length === 0) return;
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length, goNext, index]);

  const current = slides[index];

  if (loading) {
    return (
      <div className="home-destaques__carousel home-destaques__carousel--loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
      </div>
    );
  }

  if (!current) {
    return <div className="home-destaques__carousel home-destaques__carousel--empty" />;
  }

  const inner = current.href ? (
    <a href={current.href} target="_blank" rel="noopener noreferrer" className="home-destaques__carousel-link">
      <img src={current.url} alt="" className="home-destaques__carousel-img" decoding="async" />
    </a>
  ) : (
    <img src={current.url} alt="" className="home-destaques__carousel-img" decoding="async" />
  );

  return (
    <>
      <div className="home-destaques__carousel">{inner}</div>
      {slides.length > 1 && (
        <div className="home-destaques__nav">
          <button type="button" className="home-destaques__nav-btn" onClick={goPrev} aria-label="Anterior">
            <ChevronLeft size={20} />
          </button>
          <div className="home-destaques__dots">
            {slides.map((s, i) => (
              <button
                key={s.id || s.fileName || i}
                type="button"
                className={`home-destaques__dot${i === index ? ' home-destaques__dot--active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <button type="button" className="home-destaques__nav-btn" onClick={goNext} aria-label="Próximo">
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </>
  );
};

export default HomeDestaquesCarousel;
