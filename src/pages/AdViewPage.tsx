import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import photoPlaceholder from '../assets/photo view.svg';
import warningIcon from '../assets/Warning sign.svg';
import editIconUrl from '../assets/Edit icon.svg';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'auto' | 'real_estate' | 'electronics';

interface AutoParams {
    brand?: string;
    model?: string;
    yearOfManufacture?: number;
    transmission?: 'automatic' | 'manual';
    mileage?: number;
    enginePower?: number;
}

interface RealEstateParams {
    type?: 'flat' | 'house' | 'room';
    address?: string;
    area?: number;
    floor?: number;
}

interface ElectronicsParams {
    type?: 'phone' | 'laptop' | 'misc';
    brand?: string;
    model?: string;
    condition?: 'new' | 'used';
    color?: string;
}

interface AdItem {
    id: string;
    category: Category;
    title: string;
    price: number;
    description?: string;
    needsRevision: boolean;
    createdAt?: string;
    updatedAt?: string;
    images?: string[];
    imageUrl?: string;
    params?: AutoParams | RealEstateParams | ElectronicsParams;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8080';

const CATEGORY_LABELS: Record<Category, string> = {
    auto: 'Авто',
    real_estate: 'Недвижимость',
    electronics: 'Электроника',
};

const TRANSMISSION_LABELS: Record<string, string> = {
    automatic: 'Автомат',
    manual: 'Механика',
};

const REAL_ESTATE_TYPE_LABELS: Record<string, string> = {
    flat: 'Квартира',
    house: 'Дом',
    room: 'Комната',
};

const ELECTRONICS_TYPE_LABELS: Record<string, string> = {
    phone: 'Телефон',
    laptop: 'Ноутбук',
    misc: 'Другое',
};

const CONDITION_LABELS: Record<string, string> = {
    new: 'Новое',
    used: 'Б/у',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
    return `${price} ₽`
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getMissingFields(item: AdItem): string[] {
    const missing: string[] = [];
    if (!item.description) missing.push('Описание');

    if (item.category === 'electronics') {
        const p = (item.params ?? {}) as ElectronicsParams;
        if (!p.type) missing.push('Тип');
        if (!p.brand) missing.push('Бренд');
        if (!p.model) missing.push('Модель');
        if (!p.condition) missing.push('Состояние');
        if (!p.color) missing.push('Цвет');
    } else if (item.category === 'auto') {
        const p = (item.params ?? {}) as AutoParams;
        if (!p.brand) missing.push('Марка');
        if (!p.model) missing.push('Модель');
        if (!p.yearOfManufacture) missing.push('Год выпуска');
        if (!p.transmission) missing.push('Коробка передач');
        if (!p.mileage) missing.push('Пробег');
        if (!p.enginePower) missing.push('Мощность двигателя');
    } else if (item.category === 'real_estate') {
        const p = (item.params ?? {}) as RealEstateParams;
        if (!p.type) missing.push('Тип');
        if (!p.address) missing.push('Адрес');
        if (!p.area) missing.push('Площадь');
        if (!p.floor) missing.push('Этаж');
    }

    return missing;
}

// ─── Characteristics ──────────────────────────────────────────────────────────

function CharacteristicsBlock({ item }: { item: AdItem }) {
    const rows: { label: string; value: string }[] = [];

    rows.push({ label: 'Категория', value: CATEGORY_LABELS[item.category] });

    if (item.category === 'electronics') {
        const p = (item.params ?? {}) as ElectronicsParams;
        if (p.type) rows.push({ label: 'Тип', value: ELECTRONICS_TYPE_LABELS[p.type] ?? p.type });
        if (p.brand) rows.push({ label: 'Бренд', value: p.brand });
        if (p.model) rows.push({ label: 'Модель', value: p.model });
        if (p.condition) rows.push({ label: 'Состояние', value: CONDITION_LABELS[p.condition] ?? p.condition });
        if (p.color) rows.push({ label: 'Цвет', value: p.color });
    } else if (item.category === 'auto') {
        const p = (item.params ?? {}) as AutoParams;
        if (p.brand) rows.push({ label: 'Марка', value: p.brand });
        if (p.model) rows.push({ label: 'Модель', value: p.model });
        if (p.yearOfManufacture) rows.push({ label: 'Год выпуска', value: String(p.yearOfManufacture) });
        if (p.transmission) rows.push({ label: 'Коробка передач', value: TRANSMISSION_LABELS[p.transmission] ?? p.transmission });
        if (p.mileage) rows.push({ label: 'Пробег', value: `${p.mileage.toLocaleString('ru-RU')} км` });
        if (p.enginePower) rows.push({ label: 'Мощность', value: `${p.enginePower} л.с.` });
    } else if (item.category === 'real_estate') {
        const p = (item.params ?? {}) as RealEstateParams;
        if (p.type) rows.push({ label: 'Тип', value: REAL_ESTATE_TYPE_LABELS[p.type] ?? p.type });
        if (p.address) rows.push({ label: 'Адрес', value: p.address });
        if (p.area) rows.push({ label: 'Площадь', value: `${p.area} м²` });
        if (p.floor) rows.push({ label: 'Этаж', value: String(p.floor) });
    }

    return (
        <div>
            <h2 style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 700,
                fontSize: 18,
                lineHeight: '28px',
                color: 'rgba(0,0,0,0.85)',
                margin: '0 0 12px 0',
            }}>
                Характеристики
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rows.map(row => (
                    <div key={row.label} style={{ display: 'flex', gap: 10 }}>
                        <span style={{
                            width: 150,
                            flexShrink: 0,
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 600,
                            fontSize: 14,
                            lineHeight: '140%',
                            color: 'rgba(0,0,0,0.45)',
                        }}>
                            {row.label}
                        </span>
                        <span style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 400,
                            fontSize: 14,
                            lineHeight: '140%',
                            color: '#1E1E1E',
                        }}>
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [item, setItem] = useState<AdItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        setItem(null);

        fetch(`${API_BASE}/items/${id}`, { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error(`Ошибка ${res.status}`);
                return res.json();
            })
            .then(data => {
                setItem(data);
                setLoading(false);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    setError('Не удалось загрузить объявление. Убедитесь, что сервер запущен.');
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [id]);

    if (loading) {
        return (
            <div style={pageWrapStyle}>
                <p style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(0,0,0,0.45)', fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>
                    Загрузка...
                </p>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div style={pageWrapStyle}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 42px' }}>
                    <p style={{ textAlign: 'center', padding: '60px 0', color: '#ff4d4f', fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>
                        {error ?? 'Объявление не найдено'}
                    </p>
                </div>
            </div>
        );
    }

    const images = item.images?.length
        ? item.images
        : item.imageUrl
            ? [item.imageUrl]
            : [];

    const missingFields = getMissingFields(item);

    return (
        <div style={pageWrapStyle}>
            <div style={innerStyle}>

                {/* ── Верхняя полоса: Название | Цена ──────────────────────────── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 24,
                    paddingBottom: 20,
                }}>
                    {/* Левая часть: название + кнопка */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h1 style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 500,
                            fontSize: 30,
                            lineHeight: '40px',
                            letterSpacing: 0,
                            color: 'rgba(0,0,0,0.85)',
                            margin: 0,
                        }}>
                            {item.title}
                        </h1>

                        {/* Кнопка "Редактировать" — иконка белая, фон синий */}
                        <button
                            onClick={() => navigate(`/ads/${id}/edit`)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#1890FF',
                                color: '#F3F3F3',
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 20px',
                                fontFamily: 'Roboto, sans-serif',
                                fontSize: 14,
                                fontWeight: 400,
                                lineHeight: '140%',
                                cursor: 'pointer',
                                alignSelf: 'flex-start',
                            }}
                        >
                            Редактировать
                            <img src={editIconUrl} alt="" width={16} height={16} />
                        </button>
                    </div>

                    {/* Правая часть: цена + даты */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <p style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 500,
                            fontSize: 30,
                            lineHeight: '40px',
                            letterSpacing: 0,
                            color: 'rgba(0,0,0,0.85)',
                            margin: 0,
                        }}>
                            {formatPrice(item.price)}
                        </p>

                        {item.createdAt && (
                            <p style={dateStyle}>Опубликовано: {formatDate(item.createdAt)}</p>
                        )}
                        {item.updatedAt && item.updatedAt !== item.createdAt && (
                            <p style={dateStyle}>Изменено: {formatDate(item.updatedAt)}</p>
                        )}
                    </div>
                </div>

                {/* ── Разделитель #F0F0F0 ───────────────────────────────────────── */}
                <div style={{ height: 1, background: '#F0F0F0', marginBottom: 24 }} />

                {/* ── Основной контент ──────────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>

                    {/* Левая колонка: фото + описание */}
                    <div style={{ width: 480, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>

                        {/* Фото */}
                        <div style={{
                            width: '100%',
                            height: 360,
                            overflow: 'hidden',
                        }}>
                            {images.length > 0 ? (
                                <img
                                    src={images[0]}
                                    alt={item.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            ) : (
                                <img src={photoPlaceholder} alt="Нет фото" style={{ width: 400}} />
                            )}
                        </div>

                        {/* Мини-фото */}
                        {images.length > 1 && (
                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                                {images.slice(1).map((src, i) => (
                                    <img key={i} src={src} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                                ))}
                            </div>
                        )}

                        {/* Описание — под фото */}
                        <div>
                            <h2 style={sectionTitleStyle}>Описание</h2>
                            {item.description ? (
                                <p style={{
                                    fontFamily: 'Roboto, sans-serif',
                                    fontWeight: 400,
                                    fontSize: 14,
                                    lineHeight: '140%',
                                    color: '#1E1E1E',
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {item.description}
                                </p>
                            ) : (
                                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, color: 'rgba(0,0,0,0.35)', margin: 0, fontStyle: 'italic' }}>
                                    Отсутствует
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Правая колонка: плашка доработок + характеристики */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Плашка "Требуются доработки" */}
                        {missingFields.length > 0 && (
                            <div style={{
                                background: '#F9F1E6',
                                borderRadius: 12,
                                padding: '16px 20px',
                                maxWidth: 460,
                                boxShadow: '0px 9px 28px 8px rgba(0,0,0,0.05), 0px 6px 16px rgba(0,0,0,0.08), 0px 3px 6px -4px rgba(0,0,0,0.12)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <img src={warningIcon} alt="" width={18} height={18} />
                                    <span style={{
                                        fontFamily: 'Roboto, sans-serif',
                                        fontWeight: 600,
                                        fontSize: 16,
                                        lineHeight: '24px',
                                        color: '#1E1E1E',
                                    }}>
                                        Требуются доработки
                                    </span>
                                </div>
                                <p style={{
                                    fontFamily: 'Roboto, sans-serif',
                                    fontWeight: 400,
                                    fontSize: 14,
                                    lineHeight: '22px',
                                    color: 'rgba(0,0,0,0.85)',
                                    margin: '0 0 8px 0',
                                }}>
                                    У объявления не заполнены следующие поля:
                                </p>
                                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {missingFields.map(f => (
                                        <li key={f} style={{
                                            fontFamily: 'Roboto, sans-serif',
                                            fontWeight: 400,
                                            fontSize: 14,
                                            lineHeight: '22px',
                                            color: 'rgba(0,0,0,0.85)',
                                        }}>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Характеристики — без плашки, без разделителей */}
                        <CharacteristicsBlock item={item} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageWrapStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#FFFFFF',
    fontFamily: 'Roboto, sans-serif',
};

const innerStyle: React.CSSProperties = {
    maxWidth: 1200,
    minWidth: 1024,
    margin: '0 auto',
    padding: '24px 42px 40px',
    boxSizing: 'border-box',
};

const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 700,
    fontSize: 18,
    lineHeight: '10px',
    color: 'rgba(0,0,0,0.85)',
    margin: '0 0 12px 0',
};

const dateStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
    fontSize: 14,
    lineHeight: '100%',
    color: '#848388',
    margin: 0,
};
