import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import photoPlaceholder from '../assets/photo.svg';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'auto' | 'real_estate' | 'electronics';
type SortColumn = 'title' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type Layout = 'grid' | 'list';

interface AdItem {
    id: string;
    category: Category;
    title: string;
    price: number;
    needsRevision: boolean;
    createdAt?: string;
    imageUrl?: string;
}

interface ApiResponse {
    items: AdItem[];
    total: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<Category, string> = {
    auto: 'Транспорт',
    real_estate: 'Недвижимость',
    electronics: 'Электроника',
};

const ALL_CATEGORIES: Category[] = ['auto', 'real_estate', 'electronics'];
const PAGE_SIZE = 10;
const API_BASE = 'http://localhost:8080';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(price);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10ZM14 14l-3-3"
                  stroke="#BFBFBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function GridIcon({ active }: { active: boolean }) {
    const c = active ? '#1890FF' : '#8C8C8C';
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill={c}>
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
    );
}

function ListIcon({ active }: { active: boolean }) {
    const c = active ? '#1890FF' : '#8C8C8C';
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill={c}>
            <rect x="1" y="2" width="14" height="2.5" rx="1" />
            <rect x="1" y="6.75" width="14" height="2.5" rx="1" />
            <rect x="1" y="11.5" width="14" height="2.5" rx="1" />
        </svg>
    );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
        <div
            onClick={() => onChange(!on)}
            style={{
                width: 44,
                height: 22,
                borderRadius: 11,
                backgroundColor: on ? '#000' : '#D9D9D9',
                position: 'relative',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background-color 0.2s',
            }}
        >
            <div
                style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    position: 'absolute',
                    top: 2,
                    left: on ? 24 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                }}
            />
        </div>
    );
}

// ─── "Требует доработок" badge ────────────────────────────────────────────────

function NeedsBadge() {
    return (
        <span
            style={{
                display: 'inline-block',
                background: '#FAAD14',
                color: '#fff',
                borderRadius: 15,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 500,
                lineHeight: '140%',
                whiteSpace: 'nowrap',
            }}
        >
      Требует доработок
    </span>
    );
}

// ─── Filter Block ─────────────────────────────────────────────────────────────

interface FilterBlockProps {
    selectedCategories: Category[];
    onCategoryToggle: (cat: Category) => void;
    onlyNeedsRevision: boolean;
    onNeedsRevisionToggle: (v: boolean) => void;
    onReset: () => void;
}

function FilterBlock({
                         selectedCategories,
                         onCategoryToggle,
                         onlyNeedsRevision,
                         onNeedsRevisionToggle,
                         onReset,
                     }: FilterBlockProps) {
    return (
        <div style={{ width: 256, flexShrink: 0 }}>
            {/* White box — 256×247 rx=8 */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: 8,
                    padding: '16px',
                    boxSizing: 'border-box',
                    width: '100%',
                }}
            >
                {/* "Фильтры" title */}
                <p
                    style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 500,
                        fontSize: 16,
                        lineHeight: '24px',
                        color: 'rgba(0,0,0,0.85)',
                        margin: '0 0 12px 0',
                    }}
                >
                    Фильтры
                </p>

                {/* Category checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {ALL_CATEGORIES.map(cat => (
                        <label
                            key={cat}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer',
                                padding: '5px 0',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat)}
                                onChange={() => onCategoryToggle(cat)}
                                style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 2,
                                    accentColor: '#1890FF',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    margin: 0,
                                }}
                            />
                            <span
                                style={{
                                    fontFamily: 'Roboto, sans-serif',
                                    fontWeight: 400,
                                    fontSize: 14,
                                    lineHeight: '22px',
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                            >
                {CATEGORY_LABELS[cat]}
              </span>
                        </label>
                    ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#F0F0F0', margin: '12px 0' }} />

                {/* Toggle row */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                    }}
                >
          <span
              style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600,
                  fontSize: 12,
                  lineHeight: '140%',
                  color: 'rgba(0,0,0,0.85)',
              }}
          >
            Только требующие доработок
          </span>
                    <Toggle on={onlyNeedsRevision} onChange={onNeedsRevisionToggle} />
                </div>
            </div>

            {/* "Сбросить фильтры" — below the white box */}
            <button
                onClick={onReset}
                style={{
                    display: 'block',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    marginTop: 12,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: '100%',
                    color: '#848388',
                    cursor: 'pointer',
                    width: 130,
                    height: 17,
                    textAlign: 'left',
                }}
            >
                Сбросить фильтры
            </button>
        </div>
    );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

interface SearchBarProps {
    search: string;
    onSearchChange: (v: string) => void;
    sortValue: string;
    onSortChange: (v: string) => void;
    layout: Layout;
    onLayoutChange: (l: Layout) => void;
}

function SearchBar({ search, onSearchChange, sortValue, onSortChange, layout, onLayoutChange }: SearchBarProps) {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 8,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: 12,
                marginBottom: 24,
                boxSizing: 'border-box',
            }}
        >
            {/* Search input with grey bg */}
            <div
                style={{
                    flex: 1,
                    height: 32,
                    background: '#F6F6F8',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    gap: 8,
                    minWidth: 0,
                }}
            >
                <SearchIcon />
                <input
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="Найти объявление..."
                    style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 400,
                        fontSize: 14,
                        lineHeight: '22px',
                        color: 'rgba(0,0,0,0.85)',
                        minWidth: 0,
                    }}
                />
            </div>

            {/* Separator */}
            <div style={{ width: 1, height: 24, background: '#F0F0F0', flexShrink: 0 }} />

            {/* Sort */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <select
                    value={sortValue}
                    onChange={e => onSortChange(e.target.value)}
                    style={{
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 400,
                        fontSize: 14,
                        color: 'rgba(0,0,0,0.85)',
                        paddingRight: 18,
                        cursor: 'pointer',
                    }}
                >
                    <option value="createdAt_desc">Сначала новые</option>
                    <option value="createdAt_asc">Сначала старые</option>
                    <option value="title_asc">Название А → Я</option>
                    <option value="title_desc">Название Я → А</option>
                    <option value="price_asc">Сначала дешевле</option>
                    <option value="price_desc">Сначала дороже</option>
                </select>
                <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    style={{ position: 'absolute', right: 0, pointerEvents: 'none' }}
                >
                    <path d="M2 4l4 4 4-4" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            {/* Separator */}
            <div style={{ width: 1, height: 24, background: '#F0F0F0', flexShrink: 0 }} />

            {/* Layout buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <button
                    onClick={() => onLayoutChange('grid')}
                    style={{
                        width: 32, height: 32, border: 'none', borderRadius: 4,
                        background: layout === 'grid' ? '#E6F7FF' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <GridIcon active={layout === 'grid'} />
                </button>
                <button
                    onClick={() => onLayoutChange('list')}
                    style={{
                        width: 32, height: 32, border: 'none', borderRadius: 4,
                        background: layout === 'list' ? '#E6F7FF' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <ListIcon active={layout === 'list'} />
                </button>
            </div>
        </div>
    );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function AdCardGrid({ item, onClick }: { item: AdItem; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div style={{ width: '100%', aspectRatio: '4/3', background: '#FAFAFA', overflow: 'hidden' }}>
                <img
                    src={item.imageUrl ?? photoPlaceholder}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
            </div>
            <div style={{ padding: '12px 16px 16px' }}>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '22px', color: 'rgba(0,0,0,0.85)', margin: '0 0 2px' }}>
                    {CATEGORY_LABELS[item.category]}
                </p>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 16, lineHeight: '24px', color: 'rgba(0,0,0,0.85)', margin: '0 0 2px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {item.title}
                </p>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 14, lineHeight: '140%', color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                    {formatPrice(item.price)}
                </p>
                {item.needsRevision && <div style={{ marginTop: 8 }}><NeedsBadge /></div>}
            </div>
        </div>
    );
}

function AdCardList({ item, onClick }: { item: AdItem; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 16px',
            }}
        >
            <div style={{ width: 80, height: 60, borderRadius: 8, background: '#FAFAFA', overflow: 'hidden', flexShrink: 0 }}>
                <img
                    src={item.imageUrl ?? photoPlaceholder}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '22px', color: 'rgba(0,0,0,0.85)', margin: '0 0 1px' }}>
                    {CATEGORY_LABELS[item.category]}
                </p>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 16, lineHeight: '24px', color: 'rgba(0,0,0,0.85)', margin: '0 0 1px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {item.title}
                </p>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 14, lineHeight: '140%', color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                    {formatPrice(item.price)}
                </p>
            </div>
            {item.needsRevision && <NeedsBadge />}
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
    if (total <= 1) return null;

    const base: React.CSSProperties = {
        width: 32, height: 32, borderRadius: 8, background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontFamily: 'Roboto, sans-serif',
        fontSize: 14, boxSizing: 'border-box',
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {/* Prev */}
            <button
                onClick={() => current > 1 && onChange(current - 1)}
                disabled={current <= 1}
                style={{ ...base, border: '1px solid #D9D9D9', opacity: current <= 1 ? 0.4 : 1, cursor: current <= 1 ? 'default' : 'pointer' }}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M7.5 9.5L4 6l3.5-3.5" stroke="#D9D9D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* Pages */}
            {Array.from({ length: total }, (_, i) => i + 1).map(p => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    style={{
                        ...base,
                        border: p === current ? '1px solid #1890FF' : '1px solid #D9D9D9',
                        color: p === current ? '#1890FF' : 'rgba(0,0,0,0.85)',
                        fontWeight: p === current ? 500 : 400,
                    }}
                >
                    {p}
                </button>
            ))}

            {/* Next */}
            <button
                onClick={() => current < total && onChange(current + 1)}
                disabled={current >= total}
                style={{ ...base, border: '1px solid #D9D9D9', opacity: current >= total ? 0.4 : 1, cursor: current >= total ? 'default' : 'pointer' }}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="rgba(0,0,0,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdsListPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [items, setItems] = useState<AdItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState(searchParams.get('q') ?? '');
    const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [priceSortDir, setPriceSortDir] = useState<'asc' | 'desc' | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
    const [onlyNeedsRevision, setOnlyNeedsRevision] = useState(false);
    const [layout, setLayout] = useState<Layout>('grid');
    const [page, setPage] = useState(1);

    const abortRef = useRef<AbortController | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchItems = useCallback(async (opts: {
        q: string; sortCol: SortColumn; sortDir: SortDirection;
        categories: Category[]; needsRevision: boolean; page: number;
    }) => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (opts.q) params.set('q', opts.q);
        params.set('limit', String(PAGE_SIZE));
        params.set('skip', String((opts.page - 1) * PAGE_SIZE));
        params.set('sortColumn', opts.sortCol);
        params.set('sortDirection', opts.sortDir);
        if (opts.needsRevision) params.set('needsRevision', 'true');
        if (opts.categories.length) params.set('categories', opts.categories.join(','));

        try {
            const res = await fetch(`${API_BASE}/items?${params}`, { signal: abortRef.current.signal });
            if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
            const data: ApiResponse = await res.json();
            setItems(data.items);
            setTotal(data.total);
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setError('Не удалось загрузить данные. Убедитесь, что сервер запущен на порту 8080.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            fetchItems({ q: search, sortCol: sortColumn, sortDir: sortDirection, categories: selectedCategories, needsRevision: onlyNeedsRevision, page });
        }, 300);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [search, sortColumn, sortDirection, selectedCategories, onlyNeedsRevision, page, fetchItems]);

    useEffect(() => {
        const p: Record<string, string> = {};
        if (search) p.q = search;
        if (page > 1) p.page = String(page);
        setSearchParams(p, { replace: true });
    }, [search, page, setSearchParams]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const handleSortChange = (value: string) => {
        if (value.startsWith('price_')) {
            setPriceSortDir(value === 'price_asc' ? 'asc' : 'desc');
        } else {
            setPriceSortDir(null);
            const [col, dir] = value.split('_');
            setSortColumn(col as SortColumn);
            setSortDirection(dir as SortDirection);
        }
        setPage(1);
    };

    const handleCategoryToggle = (cat: Category) => {
        setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
        setPage(1);
    };

    const handleReset = () => {
        setSearch(''); setSelectedCategories([]); setOnlyNeedsRevision(false);
        setPriceSortDir(null); setSortColumn('createdAt'); setSortDirection('desc'); setPage(1);
    };

    const displayItems = priceSortDir
        ? [...items].sort((a, b) => priceSortDir === 'asc' ? a.price - b.price : b.price - a.price)
        : items;

    const currentSortValue = priceSortDir ? `price_${priceSortDir}` : `${sortColumn}_${sortDirection}`;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#F7F5F8',
                padding: '24px 42px 40px',
                boxSizing: 'border-box',
                fontFamily: 'Roboto, sans-serif',
            }}
        >
            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <h1 style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 24, lineHeight: '32px', color: 'rgba(0,0,0,0.85)', margin: 0 }}>
                    Мои объявления
                </h1>
                {!loading && total > 0 && (
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>
            {total}
          </span>
                )}
            </div>

            {/* Search bar — full width */}
            <SearchBar
                search={search}
                onSearchChange={v => { setSearch(v); setPage(1); }}
                sortValue={currentSortValue}
                onSortChange={handleSortChange}
                layout={layout}
                onLayoutChange={setLayout}
            />

            {/* Filter + Cards */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                <FilterBlock
                    selectedCategories={selectedCategories}
                    onCategoryToggle={handleCategoryToggle}
                    onlyNeedsRevision={onlyNeedsRevision}
                    onNeedsRevisionToggle={v => { setOnlyNeedsRevision(v); setPage(1); }}
                    onReset={handleReset}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                    {loading && (
                        <p style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>Загрузка...</p>
                    )}
                    {error && !loading && (
                        <p style={{ textAlign: 'center', padding: '60px 0', color: '#ff4d4f', fontSize: 14 }}>{error}</p>
                    )}
                    {!loading && !error && displayItems.length === 0 && (
                        <p style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>Объявления не найдены</p>
                    )}

                    {!loading && !error && displayItems.length > 0 && layout === 'grid' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
                            {displayItems.map(item => (
                                <AdCardGrid key={item.id} item={item} onClick={() => navigate(`/ads/${item.id}`)} />
                            ))}
                        </div>
                    )}

                    {!loading && !error && displayItems.length > 0 && layout === 'list' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {displayItems.map(item => (
                                <AdCardList key={item.id} item={item} onClick={() => navigate(`/ads/${item.id}`)} />
                            ))}
                        </div>
                    )}

                    {!loading && !error && <Pagination current={page} total={totalPages} onChange={setPage} />}
                </div>
            </div>
        </div>
    );
}
