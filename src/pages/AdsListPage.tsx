import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/theme';
import { ThemeToggle } from '../components/ThemeToggle';
import photoPlaceholder from '../assets/photo.svg';

import sectBlackUrl from '../assets/Sect black.svg';
import sectBlueUrl from '../assets/Sect blue.svg';
import listBlackUrl from '../assets/List black.svg';
import listBlueUrl from '../assets/List blue.svg';
import tickUrl from '../assets/Tick.svg';
import blankCheckmarkUrl from '../assets/Blank checkmark.svg';
import separatorUrl from '../assets/Separator.svg';

//Types

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

//Constants

const CATEGORY_LABELS: Record<Category, string> = {
    auto: 'Авто',
    real_estate: 'Недвижимость',
    electronics: 'Электроника',
};

const ALL_CATEGORIES: Category[] = ['auto', 'real_estate', 'electronics'];
const PAGE_SIZE = 10;
const API_BASE = '/api';
const LAYOUT_KEY = 'ads_layout';

function formatPrice(price: number): string {
    return `${price} ₽`;
}

//Icons

function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#000000D9" strokeWidth="1.4" />
            <path d="M10.5 10.5L13.5 13.5" stroke="#000000D9" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}

//Toggle

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <div
            onClick={() => onChange(!on)}
            style={{
                width: 44,
                height: 22,
                borderRadius: 11,
                backgroundColor: isDark
                    ? on ? '#595959' : '#8C8C8C'
                    : on ? '#595959' : '#D9D9D9',
                position: 'relative', cursor: 'pointer', flexShrink: 0,
                transition: 'background-color 0.2s',
            }}
        >
            <div style={{
                width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
                position: 'absolute', top: 2, left: on ? 24 : 2,
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }} />
        </div>
    );
}

//NeedsBadge

function NeedsBadge() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: isDark ? '#2D2000' : '#F9F1E6',
            borderRadius: 8,
            padding: '4px 10px 4px 8px',
            height: 26,
            boxSizing: 'border-box',
            whiteSpace: 'nowrap',
        }}>
            <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#FAAD14',
                flexShrink: 0,
            }} />
            <span style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: 12,
                lineHeight: '18px',
                color: isDark ? '#FFD666' : '#FAAD14',
            }}>
                Требует доработок
            </span>
        </div>
    );
}

//Filter Block

interface FilterBlockProps {
    selectedCategories: Category[];
    onCategoryToggle: (cat: Category) => void;
    onlyNeedsRevision: boolean;
    onNeedsRevisionToggle: (v: boolean) => void;
    onReset: () => void;
    isDark: boolean;
}

function FilterBlock({ selectedCategories, onCategoryToggle, onlyNeedsRevision, onNeedsRevisionToggle, onReset, isDark }: FilterBlockProps) {
    return (
        <div style={{ width: 256, flexShrink: 0 }}>
            <div style={{
                background: isDark ? '#1f1f1f' : '#fff',
                borderRadius: 8, padding: '16px', boxSizing: 'border-box', width: '100%',
            }}>
                <p style={{
                    fontFamily: 'Roboto, sans-serif', fontWeight: 500, fontSize: 16, lineHeight: '24px',
                    color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)', margin: '0 0 12px 0',
                }}>
                    Фильтры
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {ALL_CATEGORIES.map(cat => {
                        const checked = selectedCategories.includes(cat);
                        return (
                            <label
                                key={cat}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 0' }}
                                onClick={() => onCategoryToggle(cat)}
                            >
                                <img src={checked ? tickUrl : blankCheckmarkUrl} alt={checked ? 'checked' : 'unchecked'} width={16} height={16} style={{ flexShrink: 0, opacity: isDark && !checked ? 0.4 : 1 }} />
                                <span style={{
                                    fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '22px',
                                    color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                                }}>
                                    {CATEGORY_LABELS[cat]}
                                </span>
                            </label>
                        );
                    })}
                </div>

                <div style={{ height: 1, background: isDark ? '#303030' : '#F0F0F0', margin: '12px 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{
                        fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 12, lineHeight: '140%',
                        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                    }}>
                        Только требующие доработок
                    </span>
                    <Toggle on={onlyNeedsRevision} onChange={onNeedsRevisionToggle} />
                </div>
            </div>

            <button
                onClick={onReset}
                style={{
                    display: 'block', width: '100%', marginTop: 8,
                    background: isDark ? '#1f1f1f' : '#fff',
                    border: 'none', borderRadius: 8, padding: '10px 16px',
                    textAlign: 'center', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '100%',
                    color: '#848388', boxSizing: 'border-box',
                }}
            >
                Сбросить фильтры
            </button>
        </div>
    );
}

//Search Bar

interface SearchBarProps {
    search: string;
    onSearchChange: (v: string) => void;
    sortValue: string;
    onSortChange: (v: string) => void;
    layout: Layout;
    onLayoutChange: (l: Layout) => void;
    isDark: boolean;
}

function SearchBar({ search, onSearchChange, sortValue, onSortChange, layout, onLayoutChange, isDark }: SearchBarProps) {
    return (
        <div style={{
            background: isDark ? '#1f1f1f' : '#fff',
            borderRadius: 8, height: 56, display: 'flex', alignItems: 'center',
            padding: '0 12px', gap: 12, marginBottom: 24, boxSizing: 'border-box',
        }}>
            <div style={{
                flex: 1, height: 32,
                background: isDark ? '#2a2a2a' : '#F6F6F8',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                padding: '0 12px', gap: 8, minWidth: 0,
            }}>
                <input
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="Найти объявление..."
                    style={{
                        flex: 1, border: 'none', background: 'transparent', outline: 'none',
                        fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '22px',
                        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)', minWidth: 0,
                    }}
                />
                <SearchIcon />
            </div>

            <div style={{
                display: 'flex', alignItems: 'center',
                background: isDark ? '#2a2a2a' : '#F5F5F5',
                borderRadius: 8, padding: '1px', gap: 2, flexShrink: 0,
            }}>
                <button
                    onClick={() => onLayoutChange('grid')}
                    style={{ width: 32, height: 32, border: 'none', borderRadius: 6, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                    title="Сетка"
                >
                    <img src={layout === 'grid' ? sectBlueUrl : sectBlackUrl} alt="grid" width={16} height={16} />
                </button>
                <img src={separatorUrl} alt="" width={2} height={28} />
                <button
                    onClick={() => onLayoutChange('list')}
                    style={{ width: 32, height: 32, border: 'none', borderRadius: 6, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                    title="Список"
                >
                    <img src={layout === 'list' ? listBlueUrl : listBlackUrl} alt="list" width={16} height={16} />
                </button>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <select
                    value={sortValue}
                    onChange={e => onSortChange(e.target.value)}
                    style={{
                        appearance: 'none', WebkitAppearance: 'none',
                        background: isDark ? '#2a2a2a' : '#FFFFFF',
                        border: isDark ? '4px solid #303030' : '4px solid #F4F4F6',
                        borderRadius: 8, outline: 'none',
                        fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14,
                        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                        padding: '4px 36px 4px 16px', cursor: 'pointer', lineHeight: 'normal',
                    }}
                >
                    <option value="createdAt_desc">По новизне (сначала новые)</option>
                    <option value="createdAt_asc">По новизне (сначала старые)</option>
                    <option value="title_asc">По названию (А → Я)</option>
                    <option value="title_desc">По названию (Я → А)</option>
                    <option value="price_asc">По цене (сначала дешевле)</option>
                    <option value="price_desc">По цене (сначала дороже)</option>
                </select>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', right: 12, pointerEvents: 'none' }}>
                    <path d="M2 4l4 4 4-4" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
}

//Ad Card (Grid)

function AdCardGrid({ item, onClick, isDark }: { item: AdItem; onClick: () => void; isDark: boolean }) {
    return (
        <div
            onClick={onClick}
            style={{
                background: isDark ? '#1f1f1f' : '#fff',
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', position: 'relative',
            }}
        >
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: isDark ? '#2a2a2a' : '#fff' }}>
                <img
                    src={item.imageUrl ?? photoPlaceholder}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
                <div style={{
                    position: 'absolute', bottom: -14, left: 16,
                    background: isDark ? '#2a2a2a' : '#fff',
                    border: isDark ? '1px solid #434343' : '1px solid #D9D9D9',
                    borderRadius: 20, padding: '2px 10px',
                    fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '22px',
                    color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                    whiteSpace: 'nowrap',
                }}>
                    {CATEGORY_LABELS[item.category]}
                </div>
            </div>

            <div style={{ padding: '22px 16px 48px', display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
                <p style={{
                    fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 16, lineHeight: '24px',
                    color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                    margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                    {item.title}
                </p>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 14, lineHeight: '140%', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', margin: 0 }}>
                    {formatPrice(item.price)}
                </p>
            </div>

            {item.needsRevision && (
                <div style={{ position: 'absolute', bottom: 12, left: 16 }}>
                    <NeedsBadge />
                </div>
            )}
        </div>
    );
}

//Ad Card (List)

function AdCardList({ item, onClick, isDark }: { item: AdItem; onClick: () => void; isDark: boolean }) {
    return (
        <div
            onClick={onClick}
            style={{
                background: isDark ? '#1f1f1f' : '#fff',
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                display: 'flex', alignItems: 'stretch', position: 'relative',
            }}
        >
            <div style={{ width: 179, flexShrink: 0, background: isDark ? '#2a2a2a' : '#fff' }}>
                <img src={item.imageUrl ?? photoPlaceholder} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '12px 16px 40px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '22px', color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                    {CATEGORY_LABELS[item.category]}
                </p>
                <p style={{
                    fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 16, lineHeight: '24px',
                    color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                    margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                    {item.title}
                </p>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 14, lineHeight: '140%', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', margin: 0 }}>
                    {formatPrice(item.price)}
                </p>
            </div>

            {item.needsRevision && (
                <div style={{ position: 'absolute', bottom: 12, left: 195 }}>
                    <NeedsBadge />
                </div>
            )}
        </div>
    );
}

//Pagination

function Pagination({ current, total, onChange, isDark }: { current: number; total: number; onChange: (p: number) => void; isDark: boolean }) {
    if (total <= 1) return null;

    const base: React.CSSProperties = {
        width: 32, height: 32, borderRadius: 8,
        background: isDark ? '#1f1f1f' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontFamily: 'Roboto, sans-serif',
        fontSize: 14, boxSizing: 'border-box', flexShrink: 0,
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8, marginTop: 24 }}>
            <button
                onClick={() => current > 1 && onChange(current - 1)}
                disabled={current <= 1}
                style={{ ...base, border: isDark ? '1px solid #434343' : '1px solid #D9D9D9', opacity: current <= 1 ? 0.4 : 1, cursor: current <= 1 ? 'default' : 'pointer' }}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M7.5 9.5L4 6l3.5-3.5" stroke={isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {Array.from({ length: total }, (_, i) => i + 1).map(p => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    style={{
                        ...base,
                        border: p === current ? '1px solid #1890FF' : isDark ? '1px solid #434343' : '1px solid #D9D9D9',
                        color: p === current ? '#1890FF' : isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                        fontWeight: p === current ? 500 : 400,
                    }}
                >
                    {p}
                </button>
            ))}
            <button
                onClick={() => current < total && onChange(current + 1)}
                disabled={current >= total}
                style={{ ...base, border: isDark ? '1px solid #434343' : '1px solid #D9D9D9', opacity: current >= total ? 0.4 : 1, cursor: current >= total ? 'default' : 'pointer' }}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 2.5L8 6l-3.5 3.5" stroke={isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
}

//Page

export default function AdsListPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [items, setItems] = useState<AdItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [search, setSearch] = useState(searchParams.get('q') ?? '');
    const [sortColumn, setSortColumn] = useState<SortColumn>((searchParams.get('sortColumn') as SortColumn) ?? 'createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>((searchParams.get('sortDirection') as SortDirection) ?? 'desc');
    const [priceSortDir, setPriceSortDir] = useState<'asc' | 'desc' | null>((searchParams.get('priceSort') as 'asc' | 'desc') ?? null);
    const [selectedCategories, setSelectedCategories] = useState<Category[]>(searchParams.get('categories') ? searchParams.get('categories')!.split(',') as Category[] : []);
    const [onlyNeedsRevision, setOnlyNeedsRevision] = useState(searchParams.get('needsRevision') === 'true');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

    const [layout, setLayout] = useState<Layout>(() => {
        const saved = localStorage.getItem(LAYOUT_KEY);
        return (saved === 'grid' || saved === 'list') ? saved : 'grid';
    });

    const handleLayoutChange = (l: Layout) => {
        setLayout(l);
        localStorage.setItem(LAYOUT_KEY, l);
    };

    const abortRef = useRef<AbortController | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchItems = useCallback(async (opts: {
        q: string; sortCol: SortColumn; sortDir: SortDirection;
        categories: Category[]; needsRevision: boolean; page: number; priceSort: 'asc' | 'desc' | null;
    }) => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setError(null);

        const params = new URLSearchParams();
        if (opts.q) params.set('q', opts.q);
        if (opts.priceSort) {
            params.set('limit', '9999');
            params.set('skip', '0');
        } else {
            params.set('limit', String(PAGE_SIZE));
            params.set('skip', String((opts.page - 1) * PAGE_SIZE));
        }
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
        setLoading(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            fetchItems({ q: search, sortCol: sortColumn, sortDir: sortDirection, categories: selectedCategories, needsRevision: onlyNeedsRevision, page, priceSort: priceSortDir });
        }, 300);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [search, sortColumn, sortDirection, priceSortDir, selectedCategories, onlyNeedsRevision, page, fetchItems]);

    useEffect(() => {
        const p: Record<string, string> = {};
        if (search) p.q = search;
        if (page > 1) p.page = String(page);
        if (sortColumn !== 'createdAt') p.sortColumn = sortColumn;
        if (sortDirection !== 'desc') p.sortDirection = sortDirection;
        if (priceSortDir) p.priceSort = priceSortDir;
        if (selectedCategories.length) p.categories = selectedCategories.join(',');
        if (onlyNeedsRevision) p.needsRevision = 'true';
        setSearchParams(p, { replace: true });
    }, [search, page, sortColumn, sortDirection, priceSortDir, selectedCategories, onlyNeedsRevision, setSearchParams]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const handleSortChange = (value: string) => {
        if (value.startsWith('price_')) {
            setPriceSortDir(value === 'price_asc' ? 'asc' : 'desc');
            setSortColumn('createdAt');
            setSortDirection('desc');
        } else {
            setPriceSortDir(null);
            const lastUnderscore = value.lastIndexOf('_');
            const col = value.slice(0, lastUnderscore) as SortColumn;
            const dir = value.slice(lastUnderscore + 1) as SortDirection;
            setSortColumn(col);
            setSortDirection(dir);
        }
        setPage(1);
    };

    const handleCategoryToggle = (cat: Category) => {
        setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
        setPage(1);
    };

    const handleReset = () => {
        setSearch('');
        setSelectedCategories([]);
        setOnlyNeedsRevision(false);
        setPage(1);
    };

    const currentSortValue = priceSortDir ? `price_${priceSortDir}` : `${sortColumn}_${sortDirection}`;

    const allSorted = priceSortDir
        ? [...items].sort((a, b) => priceSortDir === 'asc' ? a.price - b.price : b.price - a.price)
        : items;
    const displayItems = priceSortDir ? allSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : allSorted;
    const totalPages = priceSortDir ? Math.max(1, Math.ceil(items.length / PAGE_SIZE)) : Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div style={{
            minHeight: '100vh',
            background: isDark ? '#141414' : '#F7F5F8',
            boxSizing: 'border-box',
            fontFamily: 'Roboto, sans-serif',
        }}>
            <ThemeToggle />
            <div style={{ maxWidth: 1440, minWidth: 1024, margin: '0 auto', padding: '24px 42px 40px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                    <h1 style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 24, lineHeight: '32px', color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)', margin: 0 }}>
                        Мои объявления
                    </h1>
                    {!loading && total > 0 && (
                        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>
                            {total}
                        </span>
                    )}
                </div>

                <SearchBar
                    search={search}
                    onSearchChange={v => { setSearch(v); setPage(1); }}
                    sortValue={currentSortValue}
                    onSortChange={handleSortChange}
                    layout={layout}
                    onLayoutChange={handleLayoutChange}
                    isDark={isDark}
                />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                    <FilterBlock
                        selectedCategories={selectedCategories}
                        onCategoryToggle={handleCategoryToggle}
                        onlyNeedsRevision={onlyNeedsRevision}
                        onNeedsRevisionToggle={v => { setOnlyNeedsRevision(v); setPage(1); }}
                        onReset={handleReset}
                        isDark={isDark}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                        {loading && (
                            <p style={{ textAlign: 'center', padding: '60px 0', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontSize: 14 }}>Загрузка...</p>
                        )}
                        {error && !loading && (
                            <p style={{ textAlign: 'center', padding: '60px 0', color: '#ff4d4f', fontSize: 14 }}>{error}</p>
                        )}
                        {!loading && !error && displayItems.length === 0 && (
                            <p style={{ textAlign: 'center', padding: '60px 0', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontSize: 14 }}>Объявления не найдены</p>
                        )}

                        {!loading && !error && displayItems.length > 0 && layout === 'grid' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                                {displayItems.map(item => (
                                    <AdCardGrid key={item.id} item={item} onClick={() => navigate(`/ads/${item.id}`)} isDark={isDark} />
                                ))}
                            </div>
                        )}

                        {!loading && !error && displayItems.length > 0 && layout === 'list' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {displayItems.map(item => (
                                    <AdCardList key={item.id} item={item} onClick={() => navigate(`/ads/${item.id}`)} isDark={isDark} />
                                ))}
                            </div>
                        )}

                        {!loading && !error && <Pagination current={page} total={totalPages} onChange={setPage} isDark={isDark} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
