import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { getMexicoDate, getMexicoMonth, getMexicoDateTime, formatDateForDisplay, formatMonthYear } from '../../utils/dateUtils';
import './Ventas.css';

const Ventas = () => {
  const location = useLocation();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVenta, setEditingVenta] = useState(null);
  const [sortField, setSortField] = useState('fecha');
  const [sortDirection, setSortDirection] = useState('desc');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [kombuchas, setKombuchas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [monthFilter, setMonthFilter] = useState(getMexicoMonth()); // Current month YYYY-MM
  const [viewMode, setViewMode] = useState('sales'); // 'sales' or 'clientSummary'
  const [formData, setFormData] = useState({
    fecha: getMexicoDate(), // Today's date in YYYY-MM-DD format
    cliente: '',
    items: [{ kombuchaId: '', cantidad: 1, precio: '' }],
    packs: [], // Array of pack items
    total: '0.00',
    estado: 'pendiente',
    isWholesale: false, // New field for wholesale pricing
  });

  // Fetch sales from Firebase
  const fetchVentas = async () => {
    try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'ventas'));
        const ventasData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setVentas(ventasData);
    } catch (error) {
        console.error('Error fetching sales:', error);
        setError('Error al cargar las ventas');
    } finally {
        setLoading(false);
    }
  };

  // Fetch kombuchas from Firebase
  const fetchKombuchas = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'kombuchas'));
        const kombuchasData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setKombuchas(kombuchasData);
    } catch (error) {
        console.error('Error fetching kombuchas:', error);
    }
  };

  // Fetch Clientes from Firebase
  const fetchClientes = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'clientes'));
        const clientesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setClientes(clientesData);
    } catch (error) {
        console.error('Error fetching clientes:', error);
    }
  };

  useEffect(() => {
    fetchVentas();
    fetchKombuchas();
    fetchClientes();
  }, []);



  // Handle navigation state from Clientes page
  useEffect(() => {
    if (location.state?.selectedCliente && location.state?.showForm) {
      setFormData(prev => ({
        ...prev,
        cliente: location.state.selectedCliente.id
      }));
      setShowForm(true);
    }
  }, [location.state]);

  // Handle sorting
  const handleSort = (field) => {
    setSortField(field);
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const getSortIndicator = (field) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? '▲' : '▼';
    }
    return '';
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // If wholesale checkbox changes, recalculate all prices
    if (name === 'isWholesale') {
      if (checked) {
        // When checking wholesale, apply to all items
        setTimeout(() => {
          applyWholesaleToAllItems();
        }, 0);
      } else {
        // When unchecking wholesale, immediately reset to original prices
        // This ensures pack prices are reset to $250 for full packs
        setTimeout(() => {
          resetAllPricesToOriginal();
          // Double-check pack prices are correct
          forceUpdatePackPricesToOriginal();
        }, 0);
      }
    }
  };

  // Handle item changes (kombucha, cantidad, precio)
  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      // Auto-suggest price when kombucha is selected (only if price is empty)
      if (field === 'kombuchaId' && value) {
        const selectedKombucha = kombuchas.find(k => k.id === value);
        if (selectedKombucha && selectedKombucha.precio && !updatedItems[index].precio) {
          // Apply suggested price based on current wholesale status
          updatedItems[index].precio = getSuggestedPrice(value);
        }
      }
      
      // Auto-calculate total
      const itemsTotal = updatedItems.reduce((sum, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      const packsTotal = prev.packs.reduce((sum, pack) => {
        const precio = parseFloat(pack.precio) || 0;
        return sum + precio;
      }, 0);
      
      const total = itemsTotal + packsTotal;
      

      
      return {
        ...prev,
        items: updatedItems,
        total: total.toFixed(2)
      };
    });
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { kombuchaId: '', cantidad: 1, precio: '' }]
    }));
  };

  // Add new pack
  const addPack = () => {
    setFormData(prev => {
      const newPack = { 
        kombuchas: [], // Array of kombucha IDs (can have duplicates, max 6 total)
        precio: 0 // Will be calculated when kombuchas are added
      };
      
      // Recalculate total
      const itemsTotal = prev.items.reduce((sum, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      const packsTotal = [...prev.packs, newPack].reduce((sum, pack) => {
        return sum + pack.precio;
      }, 0);
      
      const total = itemsTotal + packsTotal;
      
      return {
        ...prev,
        packs: [...prev.packs, newPack],
        total: total.toFixed(2)
      };
    });
  };

  // Remove pack
  const removePack = (index) => {
    setFormData(prev => {
      const updatedPacks = prev.packs.filter((_, i) => i !== index);
      
      // Recalculate total
      const itemsTotal = prev.items.reduce((sum, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      const packsTotal = updatedPacks.reduce((sum, pack) => {
        return sum + pack.precio;
      }, 0);
      
      const total = itemsTotal + packsTotal;
      

      
      return {
        ...prev,
        packs: updatedPacks,
        total: total.toFixed(2)
      };
    });
  };

  // Handle pack changes
  const handlePackChange = (index, field, value) => {
    setFormData(prev => {
      const updatedPacks = [...prev.packs];
      updatedPacks[index] = { ...updatedPacks[index], [field]: value };
      
      // Handle kombucha selection for packs
      if (field === 'kombuchas') {
        // Ensure we don't exceed 6 kombuchas total
        if (value.length > 6) {
          value = value.slice(0, 6);
        }
        
        // Calculate price based on wholesale status and number of kombuchas
        updatedPacks[index].precio = calculatePackPrice(value);
      }
      
      // Recalculate total
      const itemsTotal = prev.items.reduce((sum, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      const packsTotal = updatedPacks.reduce((sum, pack) => {
        return sum + pack.precio;
      }, 0);
      
      const total = itemsTotal + packsTotal;
      

      
      return {
        ...prev,
        packs: updatedPacks,
        total: total.toFixed(2)
      };
    });
  };

  // Remove item
  const removeItem = (index) => {
    setFormData(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      
      // Recalculate total
      const itemsTotal = updatedItems.reduce((sum, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      const packsTotal = prev.packs.reduce((sum, pack) => {
        const precio = parseFloat(pack.precio) || 0;
        return sum + precio;
      }, 0);
      
      const total = itemsTotal + packsTotal;
      
      return {
        ...prev,
        items: updatedItems,
        total: total.toFixed(2)
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
        // Validate required fields
        if (!formData.fecha.trim() || !formData.cliente.trim()) {
            setError('Fecha y cliente son campos obligatorios');
            return;
        }

        // Validate items and packs
        const validItems = formData.items.filter(item => item.kombuchaId && item.cantidad > 0);
        const validPacks = formData.packs.filter(pack => pack.kombuchas && pack.kombuchas.length > 0);
        
        // Must have at least one valid item OR one valid pack
        if (validItems.length === 0 && validPacks.length === 0) {
            setError('Debe agregar al menos un producto (kombucha individual o pack)');
            return;
        }
        
        const ventaData = {
            fecha: formData.fecha.trim(),
            cliente: formData.cliente.trim(),
            items: validItems,
            packs: validPacks,
            total: parseFloat(formData.total),
            estado: formData.estado,
            isWholesale: formData.isWholesale,
            fechaRegistro: editingVenta && editingVenta.fechaRegistro ? editingVenta.fechaRegistro : getMexicoDateTime(),
            fechaActualizacion: getMexicoDateTime()
        };

        if (editingVenta) {
            await updateDoc(doc(db, 'ventas', editingVenta.id), ventaData);
            setVentas(prev => prev.map(v => v.id === editingVenta.id ? { ...v, ...ventaData } : v));
            setEditingVenta(null);
        } else {
            const docRef = await addDoc(collection(db, 'ventas'), ventaData);
            setVentas(prev => [...prev, { id: docRef.id, ...ventaData }]);
        }

        setShowForm(false);
        resetForm();
    } catch (error) {
        console.error('Error saving sale:', error);
        setError('Error al guardar la venta');
    } finally {
        setSubmitting(false);
    }
  };

  const handleEdit = (venta) => {
    setEditingVenta(venta);
    
    // Convert old format to new format if needed
    let items = [];
    if (venta.items && Array.isArray(venta.items)) {
      items = venta.items;
    } else if (venta.kombucha) {
      // Convert old single item format to new format
      items = [{
        kombuchaId: venta.kombucha,
        cantidad: parseFloat(venta.cantidad) || 1,
        precio: parseFloat(venta.precio) || 0
      }];
    }
    
    // Don't add empty items if there are packs - allow packs-only sales
    
    // Calculate items total
    const itemsTotal = items.reduce((sum, item) => {
      const cantidad = parseFloat(item.cantidad) || 0;
      const precio = parseFloat(item.precio) || 0;
      return sum + (cantidad * precio);
    }, 0);
    
    // Handle packs if they exist
    let packs = [];
    let packsTotal = 0;
    if (venta.packs && Array.isArray(venta.packs)) {
      packs = venta.packs;
      packsTotal = packs.reduce((sum, pack) => sum + (pack.precio || 0), 0);
    }
    
    const total = itemsTotal + packsTotal;
    
    setFormData({
        fecha: venta.fecha || '',
        cliente: venta.cliente || '',
        items: items,
        packs: packs,
        total: total.toFixed(2),
        estado: venta.estado || 'pendiente',
        isWholesale: venta.isWholesale || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (ventaId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      return;
    }

    try {
        await deleteDoc(doc(db, 'ventas', ventaId));
        setVentas(prev => prev.filter(v => v.id !== ventaId));
    } catch (error) {
        console.error('Error deleting sale:', error);
        setError('Error al eliminar la venta');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVenta(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
        fecha: getMexicoDate(), // Today's date
        cliente: '',
        items: [],
        packs: [],
        total: '0.00',
        estado: 'pendiente',
        isWholesale: false,
    });
  };

  // Helper function to get kombucha name by ID
  const getKombuchaName = (kombuchaId) => {
    const kombucha = kombuchas.find(k => k.id === kombuchaId);
    return kombucha ? kombucha.nombre : 'Kombucha no encontrada';
  };

  // Helper function to get cliente name by ID
  const getClienteName = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  // Get original product price
  const getOriginalPrice = (kombuchaId) => {
    const kombucha = kombuchas.find(k => k.id === kombuchaId);
    return kombucha ? kombucha.precio : null;
  };

  // Calculate total kombucha count (items + packs)
  const getTotalKombuchaCount = () => {
    const itemsCount = formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad) || 0);
    }, 0);
    
    const packsCount = formData.packs.reduce((sum, pack) => {
      return sum + (pack.kombuchas?.length || 0);
    }, 0);
    
    return itemsCount + packsCount;
  };

  // Check if wholesale pricing should be applied
  const shouldApplyWholesale = () => {
    return formData.isWholesale;
  };



  // Get wholesale price ($36)
  const getWholesalePrice = () => 36.00;

  // Get suggested price based on current wholesale status
  const getSuggestedPrice = (kombuchaId) => {
    if (!kombuchaId) return 0;
    if (shouldApplyWholesale()) {
      return getWholesalePrice();
    }
    return getOriginalPrice(kombuchaId) || 0;
  };

  // Calculate pack price based on wholesale status
  const calculatePackPrice = (kombuchas) => {
    if (!kombuchas || kombuchas.length === 0) return 0;
    
    if (kombuchas.length === 6) {
      // Full pack - apply wholesale pricing if applicable
      if (shouldApplyWholesale()) {
        return getWholesalePrice() * 6; // $36 * 6 = $216
      } else {
        return 250.00; // Regular pack price
      }
    } else if (kombuchas.length > 0) {
      // Partial pack - calculate individual prices with wholesale if applicable
      const totalPrice = kombuchas.reduce((sum, kombuchaId) => {
        return sum + getSuggestedPrice(kombuchaId);
      }, 0);
      return totalPrice;
    }
    
    return 0;
  };

  // Apply wholesale pricing to all items
  const applyWholesaleToAllItems = () => {
    setFormData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.kombuchaId) {
          return { ...item, precio: getWholesalePrice() };
        }
        return item;
      });

      // Update pack prices with wholesale pricing
      const updatedPacks = prev.packs.map(pack => {
        if (pack.kombuchas && pack.kombuchas.length > 0) {
          return { ...pack, precio: calculatePackPrice(pack.kombuchas) };
        }
        return pack;
      });

      // Recalculate total
      const itemsTotal = updatedItems.reduce((sum, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      const packsTotal = updatedPacks.reduce((sum, pack) => {
        return sum + pack.precio;
      }, 0);
      
      const total = itemsTotal + packsTotal;

      return {
        ...prev,
        items: updatedItems,
        packs: updatedPacks,
        total: total.toFixed(2)
      };
    });
  };

  // Reset all prices to original
  const resetAllPricesToOriginal = () => {
    setFormData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.kombuchaId) {
          return { ...item, precio: getOriginalPrice(item.kombuchaId) || 0 };
        }
        return item;
      });

      // Reset pack prices to original (without wholesale)
      const updatedPacks = prev.packs.map(pack => {
        if (pack.kombuchas && pack.kombuchas.length > 0) {
          let originalPackPrice = 0;
          
          if (pack.kombuchas.length === 6) {
            // Full pack always costs $250
            originalPackPrice = 250.00;
          } else if (pack.kombuchas.length > 0) {
            // Partial pack - sum of individual original prices
            originalPackPrice = pack.kombuchas.reduce((sum, kombuchaId) => {
              return sum + (getOriginalPrice(kombuchaId) || 0);
            }, 0);
          }
          
          return { ...pack, precio: originalPackPrice };
        }
        return pack;
      });

      // Recalculate total
      const itemsTotal = updatedItems.reduce((sum, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      const packsTotal = updatedPacks.reduce((sum, pack) => {
        return sum + pack.precio;
      }, 0);
      
      const total = itemsTotal + packsTotal;

      return {
        ...prev,
        items: updatedItems,
        packs: updatedPacks,
        total: total.toFixed(2)
      };
    });
  };

  // Calculate total savings from wholesale pricing
  const getTotalSavings = () => {
    if (!shouldApplyWholesale()) return 0;
    
    let totalSavings = 0;
    
    // Calculate savings from individual items
    formData.items.forEach(item => {
      if (item.kombuchaId && item.cantidad) {
        const originalPrice = getOriginalPrice(item.kombuchaId) || 0;
        const wholesalePrice = getWholesalePrice();
        const savings = (originalPrice - wholesalePrice) * parseFloat(item.cantidad);
        totalSavings += savings;
      }
    });
    
    // Calculate savings from packs
    formData.packs.forEach(pack => {
      if (pack.kombuchas && pack.kombuchas.length > 0) {
        if (pack.kombuchas.length === 6) {
          // Full pack savings: $250 - ($36 * 6) = $250 - $216 = $34
          const originalPackPrice = 250.00;
          const wholesalePackPrice = getWholesalePrice() * 6;
          const packSavings = originalPackPrice - wholesalePackPrice;
          totalSavings += packSavings;
        } else {
          // Partial pack savings: sum of individual original prices - sum of wholesale prices
          const originalPackPrice = pack.kombuchas.reduce((sum, kombuchaId) => {
            return sum + (getOriginalPrice(kombuchaId) || 0);
          }, 0);
          const wholesalePackPrice = pack.kombuchas.reduce((sum, kombuchaId) => {
            return sum + getWholesalePrice();
          }, 0);
          const packSavings = originalPackPrice - wholesalePackPrice;
          totalSavings += packSavings;
        }
      }
    });
    
    return totalSavings;
  };





  // Force update pack prices to original (for debugging and manual reset)
  const forceUpdatePackPricesToOriginal = () => {
    setFormData(prev => {
      const updatedPacks = prev.packs.map(pack => {
        if (pack.kombuchas && pack.kombuchas.length > 0) {
          let originalPackPrice = 0;
          
          if (pack.kombuchas.length === 6) {
            // Full pack always costs $250
            originalPackPrice = 250.00;
          } else if (pack.kombuchas.length > 0) {
            // Partial pack - sum of individual original prices
            originalPackPrice = pack.kombuchas.reduce((sum, kombuchaId) => {
              return sum + (getOriginalPrice(kombuchaId) || 0);
            }, 0);
          }
          
          return { ...pack, precio: originalPackPrice };
        }
        return pack;
      });

      // Recalculate total with updated pack prices
      const itemsTotal = prev.items.reduce((sum, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      const packsTotal = updatedPacks.reduce((sum, pack) => {
        return sum + pack.precio;
      }, 0);
      
      const total = itemsTotal + packsTotal;

      return {
        ...prev,
        packs: updatedPacks,
        total: total.toFixed(2)
      };
    });
  };



  // Check if price has been modified
  const isPriceModified = (item) => {
    if (!item.kombuchaId || !item.precio) return false;
    const originalPrice = getOriginalPrice(item.kombuchaId);
    return originalPrice && parseFloat(item.precio) !== parseFloat(originalPrice);
  };

  // Filter sales by month
  const filteredVentas = ventas.filter(venta => {
    if (!monthFilter) return true;
    const ventaMonth = venta.fecha ? venta.fecha.slice(0, 7) : '';
    return ventaMonth === monthFilter;
  });

  // Calculate monthly statistics
  const getMonthlyStats = () => {
    const monthlyVentas = filteredVentas;
    const totalSales = monthlyVentas.length;
    const totalRevenue = monthlyVentas
      .filter(venta => venta.estado !== 'cancelada')
      .reduce((sum, venta) => sum + (parseFloat(venta.total) || 0), 0);
    const completedSales = monthlyVentas.filter(venta => venta.estado === 'completada').length;
    const pendingSales = monthlyVentas.filter(venta => venta.estado === 'pendiente').length;
    const canceledSales = monthlyVentas.filter(venta => venta.estado === 'cancelada').length;
    const paymentPendingSales = monthlyVentas.filter(venta => venta.estado === 'pagoPendiente').length;

    return {
      totalSales,
      totalRevenue,
      completedSales,
      pendingSales,
      canceledSales,
      paymentPendingSales
    };
  };

  // Calculate client summary for the month
  const getClientSummary = () => {
    const monthlyVentas = filteredVentas;
    const clientSummary = {};

    monthlyVentas.forEach(venta => {
      const clienteId = venta.cliente;
      const clienteName = getClienteName(clienteId);
      
      if (!clientSummary[clienteId]) {
        clientSummary[clienteId] = {
          clienteId,
          clienteName,
          totalPurchases: 0,
          totalAmount: 0,
          kombuchaCounts: {},
          lastPurchase: null
        };
      }

      // Only count non-canceled sales
      if (venta.estado !== 'cancelada') {
        // Count kombuchas from items
        if (venta.items && Array.isArray(venta.items)) {
          venta.items.forEach(item => {
            const kombuchaName = getKombuchaName(item.kombuchaId);
            const cantidad = parseFloat(item.cantidad) || 0;
            
            if (!clientSummary[clienteId].kombuchaCounts[kombuchaName]) {
              clientSummary[clienteId].kombuchaCounts[kombuchaName] = 0;
            }
            clientSummary[clienteId].kombuchaCounts[kombuchaName] += cantidad;
            clientSummary[clienteId].totalPurchases += cantidad;
          });
        }
        
        // Count kombuchas from packs
        if (venta.packs && Array.isArray(venta.packs)) {
          venta.packs.forEach(pack => {
            if (pack.kombuchas && Array.isArray(pack.kombuchas)) {
              pack.kombuchas.forEach(kombuchaId => {
                const kombuchaName = getKombuchaName(kombuchaId);
                
                if (!clientSummary[clienteId].kombuchaCounts[kombuchaName]) {
                  clientSummary[clienteId].kombuchaCounts[kombuchaName] = 0;
                }
                clientSummary[clienteId].kombuchaCounts[kombuchaName] += 1;
                clientSummary[clienteId].totalPurchases += 1;
              });
            }
          });
        } else if (venta.kombucha) {
          // Fallback for old format
          const kombuchaName = getKombuchaName(venta.kombucha);
          const cantidad = parseFloat(venta.cantidad) || 0;
          
          if (!clientSummary[clienteId].kombuchaCounts[kombuchaName]) {
            clientSummary[clienteId].kombuchaCounts[kombuchaName] = 0;
          }
          clientSummary[clienteId].kombuchaCounts[kombuchaName] += cantidad;
          clientSummary[clienteId].totalPurchases += cantidad;
        }

        clientSummary[clienteId].totalAmount += parseFloat(venta.total) || 0;
      }
      
      // Track last purchase date
      if (!clientSummary[clienteId].lastPurchase || venta.fecha > clientSummary[clienteId].lastPurchase) {
        clientSummary[clienteId].lastPurchase = venta.fecha;
      }
    });

    return Object.values(clientSummary).sort((a, b) => b.totalPurchases - a.totalPurchases);
  };

  const monthlyStats = getMonthlyStats();
  const clientSummary = getClientSummary();

  const sortedVentas = [...filteredVentas].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortField === 'precio' || sortField === 'total') {
      const aNum = parseFloat(aValue) || 0;
      const bNum = parseFloat(bValue) || 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    if (aValue && bValue) {
      return sortDirection === 'asc' 
        ? aValue.toString().localeCompare(bValue.toString()) 
        : bValue.toString().localeCompare(aValue.toString());
    }
    return 0;
  });

  if (loading) {
    return (
        <div className="ventas-page">
            <div className="loading">Cargando ventas...</div>
        </div>
    );
  }

  return (
    <div className="ventas-page">
        <div className="ventas-header">
            <h1>Ventas</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ color: '#2d3748', fontWeight: '600', fontSize: '0.9rem' }}>
                        Filtrar por mes:
                    </label>
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            backgroundColor: 'white'
                        }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        className={`view-toggle-btn ${viewMode === 'sales' ? 'active' : ''}`}
                        onClick={() => setViewMode('sales')}
                    >
                        Ventas
                    </button>
                    <button 
                        className={`view-toggle-btn ${viewMode === 'clientSummary' ? 'active' : ''}`}
                        onClick={() => setViewMode('clientSummary')}
                    >
                        Resumen Clientes
                    </button>
                </div>
                
                <button className="add-venta-btn" onClick={() => setShowForm(true)}>+ Nueva Venta</button>
            </div>
        </div>

        {error && (
            <div className="error-message" style={{ 
                background: '#fed7d7', 
                color: '#c53030', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1rem' 
            }}>
                {error}
            </div>
        )}

        <div className="ventas-content">
            {/* Monthly Statistics */}
            <div style={{ 
                padding: '1.5rem', 
                backgroundColor: '#f7fafc', 
                borderBottom: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
            }}>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Total Ventas</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#2d3748' }}>
                        {monthlyStats.totalSales}
                    </p>
                </div>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Ingresos Totales</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#38a169' }}>
                        ${monthlyStats.totalRevenue.toFixed(2)}
                    </p>
                </div>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Completadas</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#38a169' }}>
                        {monthlyStats.completedSales}
                    </p>
                </div>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Pendientes</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#d69e2e' }}>
                        {monthlyStats.pendingSales}
                    </p>
                </div>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Canceladas</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#c53030' }}>
                        {monthlyStats.canceledSales}
                    </p>
                </div>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Pago Pendiente</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#d69e2e' }}>
                        {monthlyStats.paymentPendingSales}
                    </p>
                </div>
            </div>

            {/* Client Summary View */}
            {viewMode === 'clientSummary' && (
                <div style={{ padding: '1.5rem' }}>
                    <h2 style={{ 
                        margin: '0 0 1.5rem 0', 
                        color: '#2d3748', 
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        textAlign: 'center'
                    }}>
                        Resumen de Compras por Cliente - {formatMonthYear(monthFilter)}
                    </h2>
                    
                    {clientSummary.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '3rem', 
                            color: '#718096',
                            fontSize: '1.1rem'
                        }}>
                            No hay compras registradas para {formatMonthYear(monthFilter)}
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {clientSummary.map((client, index) => (
                                <div key={client.clienteId} className="client-summary-card" style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid #e2e8f0',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '1rem',
                                        paddingBottom: '1rem',
                                        borderBottom: '2px solid #f7fafc'
                                    }}>
                                        <div>
                                            <h3 style={{
                                                margin: '0 0 0.5rem 0',
                                                color: '#2d3748',
                                                fontSize: '1.2rem',
                                                fontWeight: '700'
                                            }}>
                                                {client.clienteName}
                                            </h3>
                                            <p style={{
                                                margin: 0,
                                                color: '#718096',
                                                fontSize: '0.9rem'
                                            }}>
                                                Última compra: {client.lastPurchase || 'N/A'}
                                            </p>
                                        </div>
                                        <div style={{
                                            textAlign: 'right'
                                        }}>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 'bold',
                                                color: '#38a169',
                                                marginBottom: '0.25rem'
                                            }}>
                                                {client.totalPurchases}
                                            </div>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: '#718096',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                Kombuchas
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{
                                            fontSize: '1.1rem',
                                            fontWeight: '600',
                                            color: '#2d3748',
                                            marginBottom: '0.75rem'
                                        }}>
                                            Total Gastado: ${client.totalAmount.toFixed(2)}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 style={{
                                            margin: '0 0 0.75rem 0',
                                            color: '#4a5568',
                                            fontSize: '0.95rem',
                                            fontWeight: '600'
                                        }}>
                                            Detalle por Tipo:
                                        </h4>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem'
                                        }}>
                                            {Object.entries(client.kombuchaCounts).map(([kombuchaName, count]) => (
                                                <div key={kombuchaName} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem',
                                                    backgroundColor: '#f7fafc',
                                                    borderRadius: '6px',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    <span style={{
                                                        color: '#2d3748',
                                                        fontWeight: '500'
                                                    }}>
                                                        {kombuchaName}
                                                    </span>
                                                    <span style={{
                                                        color: '#38a169',
                                                        fontWeight: '600',
                                                        fontSize: '1rem'
                                                    }}>
                                                        {count}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Sales Table View */}
            {viewMode === 'sales' && (
                <>
                    {sortedVentas.length === 0 ? (
                        <div className="empty-state">
                            <p>No hay ventas registradas para {formatMonthYear(monthFilter)}</p>
                            <button className="add-venta-btn" onClick={() => setShowForm(true)}>+ Nueva Venta</button>
                        </div>
                    ) : (
                        <div className="ventas-table-container">
                            <table className="ventas-table">
                                <thead>
                                    <tr>
                                        <th className="sortable" onClick={() => handleSort('fecha')}>
                                            Fecha {getSortIndicator('fecha')}
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('cliente')}>
                                            Cliente {getSortIndicator('cliente')}
                                        </th>
                                        <th>Items</th>
                                        <th className="sortable" onClick={() => handleSort('total')}>
                                            Total {getSortIndicator('total')}
                                        </th>
                                        <th>Precio</th>
                                        <th className="sortable" onClick={() => handleSort('estado')}>
                                            Estado {getSortIndicator('estado')}
                                        </th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedVentas.map(venta => (
                                        <tr key={venta.id}>
                                            <td>{venta.fecha}</td>
                                            <td>{getClienteName(venta.cliente)}</td>
                                            <td>
                                                <div style={{ maxWidth: '300px' }}>
                                                    {/* Individual Items */}
                                                    {venta.items && Array.isArray(venta.items) && venta.items.map((item, index) => (
                                                        <div key={index} style={{ 
                                                            marginBottom: '0.5rem',
                                                            padding: '0.5rem',
                                                            backgroundColor: '#f7fafc',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            <strong>{getKombuchaName(item.kombuchaId)}</strong>
                                                            <br />
                                                            Cantidad: {item.cantidad} × ${(parseFloat(item.precio) || 0).toFixed(2)}
                                                        </div>
                                                    ))}
                                                    
                                                    {/* Pack Items */}
                                                    {venta.packs && Array.isArray(venta.packs) && venta.packs.map((pack, index) => (
                                                        <div key={`pack-${index}`} style={{ 
                                                            marginBottom: '0.5rem',
                                                            padding: '0.5rem',
                                                            backgroundColor: '#e6fffa',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem',
                                                            border: '1px solid #38a169'
                                                        }}>
                                                            <strong style={{ color: '#38a169' }}>
                                                                Pack de 6 Variedades
                                                            </strong>
                                                            <br />
                                                            <span style={{ color: '#38a169', fontWeight: '600' }}>
                                                                ${(parseFloat(pack.precio) || 0).toFixed(2)}
                                                            </span>
                                                            {pack.kombuchas && Array.isArray(pack.kombuchas) && (
                                                                <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
                                                                    {(() => {
                                                                        const flavorCounts = {};
                                                                        pack.kombuchas.forEach(kombuchaId => {
                                                                            flavorCounts[kombuchaId] = (flavorCounts[kombuchaId] || 0) + 1;
                                                                        });
                                                                        
                                                                        return Object.entries(flavorCounts).map(([kombuchaId, count]) => (
                                                                            <span key={kombuchaId} style={{ 
                                                                                display: 'inline-block',
                                                                                margin: '0.1rem',
                                                                                padding: '0.1rem 0.3rem',
                                                                                backgroundColor: 'rgba(56, 161, 105, 0.2)',
                                                                                borderRadius: '3px',
                                                                                fontSize: '0.7rem'
                                                                            }}>
                                                                                {getKombuchaName(kombuchaId)} {count > 1 ? `×${count}` : ''}
                                                                            </span>
                                                                        ));
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    
                                                    {/* Fallback for old format */}
                                                    {(!venta.items || !Array.isArray(venta.items)) && venta.kombucha && (
                                                        <div style={{ 
                                                            padding: '0.5rem',
                                                            backgroundColor: '#f7fafc',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            <strong>{getKombuchaName(venta.kombucha)}</strong>
                                                            <br />
                                                            Cantidad: {venta.cantidad} × ${(parseFloat(venta.precio) || 0).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="total-cell">${(parseFloat(venta.total) || 0).toFixed(2)}</td>
                                            <td>
                                                {venta.isWholesale ? (
                                                    <div style={{
                                                        padding: '0.5rem',
                                                        backgroundColor: 'rgba(56, 161, 105, 0.2)',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem',
                                                        textAlign: 'center',
                                                        border: '1px solid rgba(56, 161, 105, 0.4)'
                                                    }}>
                                                        <span style={{ color: '#38a169', fontWeight: '600' }}>
                                                            Mayorista
                                                        </span>
                                                        <br />
                                                        <small style={{ color: '#38a169', fontSize: '0.75rem' }}>
                                                            $36 c/u
                                                        </small>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        padding: '0.5rem',
                                                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem',
                                                        textAlign: 'center',
                                                        border: '1px solid rgba(102, 126, 234, 0.3)'
                                                    }}>
                                                        <span style={{ color: '#667eea', fontWeight: '600' }}>
                                                            Regular
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${venta.estado}`}>
                                                    {venta.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions">
                                                    <button className="edit-btn" onClick={() => handleEdit(venta)}>Editar</button>
                                                    <button className="delete-btn" onClick={() => handleDelete(venta.id)}>Eliminar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Form Overlay */}
        {showForm && (
            <div className="form-overlay">
                <div className="form-container">
                    <h2>{editingVenta ? 'Editar Venta' : 'Nueva Venta'}</h2>

                    {error && (
                        <div className="error-message" style={{ 
                            background: '#fed7d7', 
                            color: '#c53030', 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            marginBottom: '1rem' 
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="fecha">Fecha *</label>
                            <input
                                type="date"
                                id="fecha"
                                name="fecha"
                                value={formData.fecha}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cliente">Cliente *</label>
                            <select
                                id="cliente"
                                name="cliente"
                                value={formData.cliente}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Selecciona un cliente</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>
                                        {cliente.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Wholesale Pricing Section */}
                        <div className="form-group" style={{ 
                            backgroundColor: 'rgba(56, 161, 105, 0.1)', 
                            padding: '1rem', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(56, 161, 105, 0.3)',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="isWholesale"
                                    name="isWholesale"
                                    checked={formData.isWholesale}
                                    onChange={handleInputChange}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        accentColor: '#38a169'
                                    }}
                                />
                                <label htmlFor="isWholesale" style={{ 
                                    color: '#38a169', 
                                    fontSize: '1rem', 
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}>
                                    Precio Mayorista ($36 por kombucha)
                                </label>
                            </div>
                            <div style={{ 
                                fontSize: '0.85rem', 
                                color: '#38a169',
                                marginLeft: '1.5rem'
                            }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={applyWholesaleToAllItems}
                                        disabled={shouldApplyWholesale()}
                                        style={{
                                            background: shouldApplyWholesale() ? '#718096' : '#38a169',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '3px',
                                            cursor: shouldApplyWholesale() ? 'not-allowed' : 'pointer',
                                            fontSize: '0.8rem',
                                            marginRight: '0.5rem'
                                        }}
                                    >
                                        {shouldApplyWholesale() ? 'Ya aplicado' : 'Aplicar a todos'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetAllPricesToOriginal}
                                        style={{
                                            background: '#e53e3e',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        Restaurar precios
                                    </button>
                                </div>
                                {formData.isWholesale ? (
                                    <span style={{ color: '#90ee90', fontWeight: 'bold' }}>
                                        ✓ Aplicando precio mayorista ($36 por kombucha)
                                    </span>
                                ) : (
                                                                    <span>
                                    Selección manual del precio mayorista
                                </span>
                                )}
                            </div>
                            {getTotalKombuchaCount() > 0 && (
                                <div style={{ 
                                    fontSize: '0.8rem', 
                                    color: '#e2e8f0',
                                    marginLeft: '1.5rem',
                                    marginTop: '0.5rem'
                                }}>
                                    <span>
                                        Total de kombuchas: {getTotalKombuchaCount()} 

                                    </span>
                                    {getTotalKombuchaCount() > 0 && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                                            <span>
                                                {shouldApplyWholesale() ? (
                                                    <>
                                                        <span style={{ color: '#90ee90' }}>
                                                            Precio por kombucha: ${getWholesalePrice().toFixed(2)}
                                                        </span>
                                                        <span style={{ color: '#a0aec0' }}>
                                                            {' '}• Ahorro total: ${getTotalSavings().toFixed(2)}
                                                        </span>
                                                        <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: '#cbd5e0' }}>
                                                            {/* Individual item savings */}
                                                            {formData.items.filter(item => item.kombuchaId).map((item, idx) => {
                                                                const originalPrice = getOriginalPrice(item.kombuchaId) || 0;
                                                                const savings = (originalPrice - getWholesalePrice()) * parseFloat(item.cantidad);
                                                                return savings > 0 ? (
                                                                    <div key={`item-${idx}`}>
                                                                        {getKombuchaName(item.kombuchaId)}: ${savings.toFixed(2)} de ahorro
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                            {/* Pack savings */}
                                                            {formData.packs.filter(pack => pack.kombuchas && pack.kombuchas.length > 0).map((pack, idx) => {
                                                                let packSavings = 0;
                                                                if (pack.kombuchas.length === 6) {
                                                                    packSavings = 250.00 - (getWholesalePrice() * 6);
                                                                } else {
                                                                    const originalPackPrice = pack.kombuchas.reduce((sum, kombuchaId) => {
                                                                        return sum + (getOriginalPrice(kombuchaId) || 0);
                                                                    }, 0);
                                                                    const wholesalePackPrice = pack.kombuchas.length * getWholesalePrice();
                                                                    packSavings = originalPackPrice - wholesalePackPrice;
                                                                }
                                                                return packSavings > 0 ? (
                                                                    <div key={`pack-${idx}`}>
                                                                        Pack {idx + 1} ({pack.kombuchas.length} kombuchas): ${packSavings.toFixed(2)} de ahorro
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span style={{ color: '#a0aec0' }}>
                                                        Precio por kombucha: ${formData.items.find(item => item.kombuchaId)?.precio || '0.00'}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label>Productos de la Venta {formData.packs.length === 0 ? '*' : '(Opcional si hay packs)'}</label>
                            
                            {/* Pricing Summary */}
                            {getTotalKombuchaCount() > 0 && (
                                <div style={{ 
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    backgroundColor: shouldApplyWholesale() ? 'rgba(56, 161, 105, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                                    border: `1px solid ${shouldApplyWholesale() ? '#38a169' : '#667eea'}`,
                                    borderRadius: '8px',
                                    fontSize: '0.9rem'
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        marginBottom: '0.5rem'
                                    }}>
                                        <strong style={{ color: shouldApplyWholesale() ? '#38a169' : '#667eea' }}>
                                            {shouldApplyWholesale() ? 'Precio Mayorista Aplicado' : 'Precio Regular'}
                                        </strong>
                                        <span style={{ 
                                            color: shouldApplyWholesale() ? '#38a169' : '#667eea',
                                            fontWeight: 'bold'
                                        }}>
                                            ${shouldApplyWholesale() ? getWholesalePrice().toFixed(2) : '0.00'} por kombucha
                                        </span>
                                    </div>
                                    {shouldApplyWholesale() && (
                                        <div style={{ color: '#38a169', fontSize: '0.8rem' }}>
                                            ✓ Ahorro total: ${getTotalSavings().toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{ marginBottom: '1rem' }}>
                                <button 
                                    type="button" 
                                    onClick={addItem}
                                    style={{
                                        background: '#4299e1',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        marginRight: '0.5rem'
                                    }}
                                >
                                    + Agregar Producto
                                </button>
                                <button 
                                    type="button" 
                                    onClick={addPack}
                                    style={{
                                        background: '#38a169',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    + Agregar Pack 6
                                </button>
                            </div>
                            
                            {/* Message when no individual items */}
                            {formData.items.length === 0 && formData.packs.length > 0 && (
                                <div style={{ 
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    backgroundColor: 'rgba(56, 161, 105, 0.1)',
                                    border: '1px solid #38a169',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    fontSize: '0.9rem'
                                }}>
                                    <span style={{ color: '#38a169', fontWeight: '600' }}>
                                        ✓ Solo vendiendo packs - No se requieren productos individuales
                                    </span>
                                </div>
                            )}
                            
                            {/* Individual Items */}
                            {formData.items.length === 0 && formData.packs.length === 0 && (
                                <div style={{ 
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                    border: '1px solid #667eea',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    fontSize: '0.9rem'
                                }}>
                                    <span style={{ color: '#667eea', fontWeight: '600' }}>
                                        Agrega productos individuales o packs para comenzar la venta
                                    </span>
                                </div>
                            )}
                            
                            {formData.items.map((item, index) => (
                                <div key={index} style={{ 
                                    border: '1px solid #667eea', 
                                    borderRadius: '8px', 
                                    padding: '1rem', 
                                    marginBottom: '1rem',
                                    backgroundColor: 'rgb(102, 126, 234)',
                                    color: 'white'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ color: 'white', margin: 0 }}>Producto {index + 1}</h4>
                                        {(formData.items.length > 1 || formData.packs.length > 0) && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeItem(index)}
                                                style={{
                                                    background: '#f56565',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                Kombucha {formData.packs.length === 0 ? '*' : '(Opcional)'}
                                            </label>
                                            <select
                                                value={item.kombuchaId}
                                                onChange={(e) => handleItemChange(index, 'kombuchaId', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    border: '2px solid #667eea',
                                                    borderRadius: '5px',
                                                    backgroundColor: 'white',
                                                    color: '#2d3748'
                                                }}
                                                required={formData.packs.length === 0}
                                            >
                                                <option value="">Selecciona una kombucha</option>
                                                {kombuchas.map(kombucha => (
                                                    <option key={kombucha.id} value={kombucha.id}>
                                                        {kombucha.nombre} - ${kombucha.precio?.toFixed(2) || '0.00'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                Cantidad {formData.packs.length === 0 ? '*' : '(Opcional)'}
                                            </label>
                                            <input
                                                type="number"
                                                value={item.cantidad}
                                                onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                                                min="1"
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    border: '2px solid #667eea',
                                                    borderRadius: '5px',
                                                    backgroundColor: 'white',
                                                    color: '#2d3748'
                                                }}
                                                required={formData.packs.length === 0}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                Precio {formData.packs.length === 0 ? '*' : '(Opcional)'}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.precio}
                                                onChange={(e) => handleItemChange(index, 'precio', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    border: isPriceModified(item) ? '2px solid #f56565' : '2px solid #667eea',
                                                    borderRadius: '5px',
                                                    backgroundColor: 'white',
                                                    color: '#4a5568'
                                                }}
                                                placeholder="0.00"
                                                required={formData.packs.length === 0}
                                            />
                                            <small style={{ color: 'white', fontSize: '0.7rem' }}>
                                                {item.kombuchaId && getOriginalPrice(item.kombuchaId) ? (
                                                    <>
                                                        {shouldApplyWholesale() ? (
                                                            <>
                                                                <span style={{ color: '#90ee90', fontWeight: 'bold' }}>
                                                                    Precio mayorista: ${getWholesalePrice().toFixed(2)}
                                                                </span>
                                                                <span style={{ color: '#e2e8f0', fontSize: '0.65rem' }}>
                                                                    {' '}(Original: ${getOriginalPrice(item.kombuchaId).toFixed(2)})
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                Precio original: ${getOriginalPrice(item.kombuchaId).toFixed(2)}
                                                                <span style={{ color: '#90ee90', fontSize: '0.65rem' }}>
                                                                    {' '}(Mayorista: ${getWholesalePrice().toFixed(2)})
                                                                </span>
                                                            </>
                                                        )}
                                                        {isPriceModified(item) && (
                                                            <>
                                                                <span style={{ color: '#f56565', fontWeight: 'bold' }}>
                                                                    {' '}• Modificado
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleItemChange(index, 'precio', getSuggestedPrice(item.kombuchaId))}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: '#4299e1',
                                                                        textDecoration: 'underline',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.7rem',
                                                                        marginLeft: '0.5rem'
                                                                    }}
                                                                >
                                                                    Restaurar
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    'Precio sugerido del producto (puede ser modificado)'
                                                )}
                                            </small>
                                        </div>
                                    </div>
                                    
                                    <div style={{ 
                                        marginTop: '0.5rem', 
                                        padding: '0.5rem', 
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                                        borderRadius: '5px',
                                        textAlign: 'center'
                                    }}>
                                        <strong style={{ color: 'white' }}>
                                            Subtotal: ${((parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0)).toFixed(2)}
                                        </strong>
                                    </div>
                                </div>
                            ))}

                            {/* 6-Pack Items */}
                            {formData.packs.length > 0 && (
                                <div style={{ marginTop: '2rem' }}>
                                    <h3 style={{ color: '#2d3748', marginBottom: '1rem', fontSize: '1.1rem' }}>Packs de 6 Variedades</h3>
                                    {formData.packs.map((pack, index) => (
                                        <div key={index} style={{ 
                                            border: '1px solid #38a169', 
                                            borderRadius: '8px', 
                                            padding: '1rem', 
                                            marginBottom: '1rem',
                                            backgroundColor: '#38a169',
                                            color: 'white'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <h4 style={{ color: 'white', margin: 0 }}>Pack {index + 1}</h4>
                                                <button 
                                                    type="button" 
                                                    onClick={() => removePack(index)}
                                                    style={{
                                                        background: '#f56565',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                            
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                    Selecciona hasta 6 Kombuchas (puedes repetir sabores) *
                                                </label>
                                                <div style={{ 
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.5rem',
                                                    maxHeight: '300px',
                                                    overflowY: 'auto',
                                                    padding: '0.75rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                                }}>
                                                    {kombuchas.map(kombucha => {
                                                        const currentCount = (pack.kombuchas || []).filter(id => id === kombucha.id).length;
                                                        return (
                                                            <div key={kombucha.id} style={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'space-between',
                                                                padding: '0.75rem',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                                borderRadius: '6px',
                                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                transition: 'all 0.2s ease'
                                                            }}>
                                                                {/* Kombucha Info */}
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    flexDirection: 'column',
                                                                    gap: '0.25rem',
                                                                    flex: 1
                                                                }}>
                                                                    <span style={{ 
                                                                        fontSize: '0.9rem', 
                                                                        color: 'white', 
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        {kombucha.nombre}
                                                                    </span>
                                                                    <span style={{ 
                                                                        fontSize: '0.75rem', 
                                                                        color: 'rgba(255, 255, 255, 0.7)'
                                                                    }}>
                                                                        ${kombucha.precio?.toFixed(2) || '0.00'} por unidad
                                                                    </span>
                                                                </div>
                                                                
                                                                {/* Quantity Controls */}
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    gap: '0.5rem',
                                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                                    padding: '0.5rem',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                                                }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const currentKombuchas = pack.kombuchas || [];
                                                                            const newKombuchas = [...currentKombuchas, kombucha.id];
                                                                            if (newKombuchas.length <= 6) {
                                                                                handlePackChange(index, 'kombuchas', newKombuchas);
                                                                            }
                                                                        }}
                                                                        disabled={(pack.kombuchas?.length || 0) >= 6}
                                                                        style={{
                                                                            background: (pack.kombuchas?.length || 0) >= 6 ? '#718096' : '#38a169',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            width: '28px',
                                                                            height: '28px',
                                                                            cursor: (pack.kombuchas?.length || 0) >= 6 ? 'not-allowed' : 'pointer',
                                                                            fontSize: '1.1rem',
                                                                            fontWeight: 'bold',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            transition: 'all 0.2s ease'
                                                                        }}
                                                                        title="Agregar una unidad"
                                                                    >
                                                                        +
                                                                    </button>
                                                                    
                                                                    <span style={{ 
                                                                        color: 'white', 
                                                                        fontWeight: 'bold',
                                                                        fontSize: '1.1rem',
                                                                        minWidth: '30px',
                                                                        textAlign: 'center',
                                                                        padding: '0.25rem 0.5rem',
                                                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                                        borderRadius: '4px'
                                                                    }}>
                                                                        {currentCount}
                                                                    </span>
                                                                    
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const currentKombuchas = pack.kombuchas || [];
                                                                            const kombuchaIndex = currentKombuchas.indexOf(kombucha.id);
                                                                            if (kombuchaIndex > -1) {
                                                                                const newKombuchas = [...currentKombuchas];
                                                                                newKombuchas.splice(kombuchaIndex, 1);
                                                                                handlePackChange(index, 'kombuchas', newKombuchas);
                                                                            }
                                                                        }}
                                                                        disabled={currentCount === 0}
                                                                        style={{
                                                                            background: currentCount === 0 ? '#718096' : '#f56565',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            width: '28px',
                                                                            height: '28px',
                                                                            cursor: currentCount === 0 ? 'not-allowed' : 'pointer',
                                                                            fontSize: '1.1rem',
                                                                            fontWeight: 'bold',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            transition: 'all 0.2s ease'
                                                                        }}
                                                                        title="Quitar una unidad"
                                                                    >
                                                                        -
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                
                                                {/* Selection Summary */}
                                                <div style={{ 
                                                    marginTop: '1rem',
                                                    padding: '0.75rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                                }}>
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        <span style={{ 
                                                            color: 'white', 
                                                            fontSize: '0.9rem',
                                                            fontWeight: '500'
                                                        }}>
                                                            {pack.kombuchas?.length || 0}/6 kombuchas seleccionadas
                                                        </span>
                                                        {pack.kombuchas?.length === 6 && (
                                                            <span style={{ 
                                                                color: '#90ee90', 
                                                                fontWeight: 'bold',
                                                                fontSize: '0.85rem'
                                                            }}>
                                                                ✓ Pack completo
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Selected Items Breakdown */}
                                                    {pack.kombuchas && pack.kombuchas.length > 0 && (
                                                        <div style={{ 
                                                            fontSize: '0.8rem',
                                                            color: 'rgba(255, 255, 255, 0.8)'
                                                        }}>
                                                            {(() => {
                                                                const flavorCounts = {};
                                                                pack.kombuchas.forEach(kombuchaId => {
                                                                    flavorCounts[kombuchaId] = (flavorCounts[kombuchaId] || 0) + 1;
                                                                });
                                                                
                                                                return Object.entries(flavorCounts).map(([kombuchaId, count]) => (
                                                                    <span key={kombuchaId} style={{ 
                                                                        display: 'inline-block',
                                                                        margin: '0.1rem',
                                                                        padding: '0.2rem 0.4rem',
                                                                        backgroundColor: 'rgba(56, 161, 105, 0.3)',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.75rem',
                                                                        border: '1px solid rgba(56, 161, 105, 0.5)'
                                                                    }}>
                                                                        {getKombuchaName(kombuchaId)} ×{count}
                                                                    </span>
                                                                ));
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div style={{ 
                                                padding: '0.75rem', 
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                                                borderRadius: '5px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ color: 'white' }}>
                                                    {pack.kombuchas?.length === 6 ? (
                                                        <div>
                                                            <strong>
                                                                Pack completo de 6 variedades: 
                                                                {shouldApplyWholesale() ? (
                                                                    <span style={{ color: '#90ee90' }}>
                                                                        ${(getWholesalePrice() * 6).toFixed(2)}
                                                                    </span>
                                                                ) : (
                                                                    <span>${250.00}</span>
                                                                )}
                                                            </strong>
                                                            {shouldApplyWholesale() ? (
                                                                <div>
                                                                    <br />
                                                                    <small style={{ fontSize: '0.7rem', color: '#90ee90' }}>
                                                                        Precio mayorista (${getWholesalePrice().toFixed(2)} × 6)
                                                                    </small>
                                                                    <br />
                                                                    <small style={{ fontSize: '0.7rem', color: '#cbd5e0' }}>
                                                                        Precio regular: ${250.00}
                                                                    </small>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <br />
                                                                    <small style={{ fontSize: '0.7rem', color: '#90ee90' }}>
                                                                        Con precio mayorista: ${(getWholesalePrice() * 6).toFixed(2)}
                                                                    </small>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : pack.kombuchas?.length > 0 ? (
                                                        <div>
                                                            <strong>
                                                                Pack parcial ({pack.kombuchas.length} kombuchas): ${pack.precio.toFixed(2)}
                                                            </strong>
                                                            {shouldApplyWholesale() && (
                                                                <div>
                                                                    <br />
                                                                    <small style={{ fontSize: '0.7rem', color: '#90ee90' }}>
                                                                        Precio mayorista aplicado
                                                                    </small>
                                                                </div>
                                                            )}
                                                            <br />
                                                            <small style={{ fontSize: '0.8rem' }}>
                                                                Selecciona 6 para obtener el precio pack de ${250.00}
                                                                {shouldApplyWholesale() && ` o ${(getWholesalePrice() * 6).toFixed(2)} con mayorista`}
                                                            </small>
                                                        </div>
                                                    ) : (
                                                        <strong>Selecciona kombuchas para el pack</strong>
                                                    )}
                                                </div>
                                                
                                                {/* Pack Price Restore Button */}
                                                {pack.kombuchas && pack.kombuchas.length > 0 && (
                                                    <div style={{ 
                                                        marginTop: '0.75rem',
                                                        textAlign: 'center'
                                                    }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                // Reset this specific pack to original pricing
                                                                const updatedPack = { ...pack };
                                                                if (pack.kombuchas.length === 6) {
                                                                    updatedPack.precio = 250.00;
                                                                } else {
                                                                    updatedPack.precio = pack.kombuchas.reduce((sum, kombuchaId) => {
                                                                        return sum + (getOriginalPrice(kombuchaId) || 0);
                                                                    }, 0);
                                                                }
                                                                
                                                                // Update the pack and recalculate total
                                                                setFormData(prev => {
                                                                    const updatedPacks = [...prev.packs];
                                                                    updatedPacks[index] = updatedPack;
                                                                    
                                                                    const itemsTotal = prev.items.reduce((sum, item) => {
                                                                        const cantidad = parseFloat(item.cantidad) || 0;
                                                                        const precio = parseFloat(item.precio) || 0;
                                                                        return sum + (cantidad * precio);
                                                                    }, 0);
                                                                    
                                                                    const packsTotal = updatedPacks.reduce((sum, pack) => {
                                                                        return sum + pack.precio;
                                                                    }, 0);
                                                                    
                                                                    const total = itemsTotal + packsTotal;
                                                                    
                                                                    return {
                                                                        ...prev,
                                                                        packs: updatedPacks,
                                                                        total: total.toFixed(2)
                                                                    };
                                                                });
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: '1px solid #90ee90',
                                                                color: '#90ee90',
                                                                padding: '0.5rem 1rem',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseOver={(e) => {
                                                                e.target.style.background = '#90ee90';
                                                                e.target.style.color = 'white';
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.target.style.background = 'none';
                                                                e.target.style.color = '#90ee90';
                                                            }}
                                                            title="Restaurar precio original del pack"
                                                        >
                                                            Restaurar pack
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="total">Total *</label>
                            <input
                                type="number"
                                id="total"
                                name="total"
                                value={formData.total}
                                readOnly
                                style={{ 
                                    backgroundColor: '#f7fafc', 
                                    color: '#4a5568',
                                    cursor: 'not-allowed',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                }}
                            />
                            <small style={{ color: 'white', fontSize: '0.8rem' }}>
                                Calculado automáticamente (suma de todos los productos)
                            </small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="estado">Estado *</label>
                            <select
                                id="estado"
                                name="estado"
                                value={formData.estado}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="pendiente">Pendiente</option>
                                <option value="cancelada">Cancelada</option>
                                <option value="pagoPendiente">Pago Pendiente</option>
                                <option value="completada">Completada</option>
                            </select>
                        </div>
                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="cancel-btn" 
                                onClick={handleCancel}
                                disabled={submitting}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="save-btn"
                                disabled={submitting}
                            >
                                {submitting ? 'Guardando...' : (editingVenta ? 'Actualizar' : 'Guardar')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Ventas;