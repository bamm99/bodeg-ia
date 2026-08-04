import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Edit2, Trash2, Box, Scale, AlertCircle } from 'lucide-react';
import { apiFetch } from '../config/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  unit_weight_kg: number;
  unit_volume_m3: number;
  is_palletized: boolean;
  created_at?: string;
}

export const ProductsCatalogView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    unit_weight_kg: 10.0,
    unit_volume_m3: 0.05,
    is_palletized: false,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/catalog/products?search=${searchQuery}&limit=100`);
      if (res.data) setProducts(res.data);
    } catch (err) {
      console.error('Error cargando catálogo de productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const handleOpenModal = (p?: Product) => {
    setError(null);
    if (p) {
      setEditingProduct(p);
      setFormData({
        sku: p.sku,
        name: p.name,
        unit_weight_kg: p.unit_weight_kg,
        unit_volume_m3: p.unit_volume_m3,
        is_palletized: p.is_palletized,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        sku: '',
        name: '',
        unit_weight_kg: 10.0,
        unit_volume_m3: 0.05,
        is_palletized: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku.trim() || !formData.name.trim()) {
      setError('El SKU y Nombre del producto son obligatorios');
      return;
    }

    try {
      if (editingProduct) {
        await apiFetch(`/catalog/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch('/catalog/products', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Error al guardar producto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este producto del catálogo?')) return;
    try {
      await apiFetch(`/catalog/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar producto');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={24} color="var(--primary)" />
            Catálogo Maestro de Productos & SKUs
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Administra los ítems comercializables y sus características dimensionales de cubicaje (m³) y peso (kg).
          </p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={16} />
          <span>Nuevo Producto (SKU)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Buscar por SKU o Nombre de producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%' }}
          />
        </div>
      </div>

      {/* Table Panel */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px' }}>SKU Identificador</th>
              <th style={{ padding: '16px' }}>Nombre del Producto</th>
              <th style={{ padding: '16px' }}>Volumen Unitario</th>
              <th style={{ padding: '16px' }}>Peso Unitario</th>
              <th style={{ padding: '16px' }}>Formato</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando productos...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron productos en el catálogo.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                    {p.sku}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {p.name}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Box size={14} color="var(--primary)" />
                      {p.unit_volume_m3} m³
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Scale size={14} color="var(--text-muted)" />
                      {p.unit_weight_kg} kg
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {p.is_palletized ? (
                      <span className="badge badge-primary">Paletizado</span>
                    ) : (
                      <span className="badge badge-low">Caja / Granel</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleOpenModal(p)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-secondary" style={{ padding: '6px 10px', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
              {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto (SKU)'}
            </h3>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Código SKU *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ej. HAR-IND-25"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Nombre del Producto *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ej. Caja Harina Industrial 25kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Volumen Unitario (m³)</label>
                  <input
                    type="number"
                    step="0.001"
                    className="input"
                    value={formData.unit_volume_m3}
                    onChange={(e) => setFormData({ ...formData, unit_volume_m3: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Peso Unitario (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.unit_weight_kg}
                    onChange={(e) => setFormData({ ...formData, unit_weight_kg: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="palletizedCheck"
                  checked={formData.is_palletized}
                  onChange={(e) => setFormData({ ...formData, is_palletized: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="palletizedCheck" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Producto Paletizado (Requiere posición completa en repisa)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
