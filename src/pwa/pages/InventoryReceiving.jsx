// ============================================================================
// InventoryReceiving.jsx - PWA Inventory Receiving Page
// ============================================================================
// Mobile-optimized workflow for receiving inventory against purchase orders.
// Supports quantity entry, photo capture, and damage tracking.
//
// Created: January 17, 2026
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Package,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Camera,
  X,
  Loader2,
  Truck,
  ClipboardList,
  Box,
  ChevronRight,
  Plus,
  Minus,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { useWorkerAuth } from '../contexts/WorkerAuthContext';
import {
  getPendingPurchaseOrders,
  searchPurchaseOrders,
  getPurchaseOrderById
} from '../../services/purchaseOrdersService';
import {
  createReceipt,
  uploadReceiptPhoto,
  getReceiptStatusColor
} from '../../services/inventoryReceiptsService';

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS = {
  SELECT_PO: 'select_po',
  VIEW_ITEMS: 'view_items',
  RECEIVE_ITEM: 'receive_item',
  COMPLETE: 'complete'
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    padding: 'var(--space-md)',
    paddingBottom: '100px',
    minHeight: '100vh',
    background: 'var(--bg-primary)'
  },
  searchSection: {
    marginBottom: 'var(--space-lg)'
  },
  searchInputWrapper: {
    position: 'relative',
    marginBottom: 'var(--space-md)'
  },
  searchInput: {
    width: '100%',
    padding: 'var(--space-md)',
    paddingLeft: '44px',
    fontSize: '16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)'
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  poList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  poItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  poIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    background: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 'var(--radius-md)',
    marginRight: 'var(--space-md)',
    color: '#6366f1'
  },
  poInfo: {
    flex: 1
  },
  poNumber: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '2px'
  },
  poMeta: {
    fontSize: '0.813rem',
    color: 'var(--text-secondary)'
  },
  poBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75rem',
    fontWeight: '500',
    marginTop: '4px'
  },

  // Step header
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
    paddingBottom: 'var(--space-md)',
    borderBottom: '1px solid var(--border-color)'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    background: 'var(--bg-tertiary)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  stepTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  stepSubtitle: {
    fontSize: '0.813rem',
    color: 'var(--text-secondary)'
  },

  // PO detail card
  poDetailCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)'
  },
  poDetailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)'
  },
  poDetailIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: '#22c55e'
  },
  poDetailInfo: {
    flex: 1
  },
  poDetailNumber: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  poDetailVendor: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },

  // Line items
  lineItemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  lineItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  lineItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  lineItemReceived: {
    borderColor: '#22c55e',
    background: 'rgba(34, 197, 94, 0.05)'
  },
  lineItemInfo: {
    flex: 1
  },
  lineItemName: {
    fontSize: '0.938rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    marginBottom: '2px'
  },
  lineItemMeta: {
    fontSize: '0.813rem',
    color: 'var(--text-secondary)'
  },
  lineItemQty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  lineItemQtyLabel: {
    fontSize: '0.625rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase'
  },
  lineItemQtyValue: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },

  // Receive form
  formSection: {
    marginBottom: 'var(--space-lg)'
  },
  formLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-sm)',
    display: 'block'
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)'
  },
  quantityButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '1.25rem',
    cursor: 'pointer'
  },
  quantityInput: {
    flex: 1,
    padding: 'var(--space-md)',
    fontSize: '1.5rem',
    fontWeight: '600',
    textAlign: 'center',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  textArea: {
    width: '100%',
    padding: 'var(--space-md)',
    fontSize: '0.938rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px'
  },

  // Photo section
  photoSection: {
    marginBottom: 'var(--space-lg)'
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-md)'
  },
  photoPreview: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    background: 'var(--bg-tertiary)'
  },
  photoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  photoRemove: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '24px',
    height: '24px',
    background: 'rgba(0,0,0,0.6)',
    border: 'none',
    borderRadius: '50%',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  addPhotoButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    cursor: 'pointer'
  },

  // Damage toggle
  damageToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-md)',
    cursor: 'pointer'
  },
  damageToggleActive: {
    borderColor: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.1)'
  },
  toggleCheckbox: {
    width: '24px',
    height: '24px',
    borderRadius: 'var(--radius-sm)',
    border: '2px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
  },
  toggleCheckboxActive: {
    background: '#f59e0b',
    borderColor: '#f59e0b'
  },

  // Action buttons
  actionButton: {
    width: '100%',
    padding: 'var(--space-lg)',
    fontSize: '1rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    transition: 'all 0.15s ease'
  },
  primaryButton: {
    background: 'var(--sunbelt-orange)',
    color: 'white'
  },
  secondaryButton: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)'
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },

  // Complete state
  completeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xl)',
    textAlign: 'center'
  },
  completeIcon: {
    width: '80px',
    height: '80px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--space-lg)'
  },
  completeTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-sm)'
  },
  completeMessage: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-xl)'
  },
  receiptSummary: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    width: '100%',
    maxWidth: '300px',
    marginBottom: 'var(--space-xl)',
    textAlign: 'left'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-sm)'
  },
  summaryLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },
  summaryValue: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * PO list item
 */
const POListItem = ({ po, onClick }) => {
  const statusColor = po.status === 'Partial' ? '#f97316' : '#22c55e';
  const itemCount = po.line_items?.length || 0;

  return (
    <div style={styles.poItem} onClick={onClick}>
      <div style={styles.poIcon}>
        <Truck size={22} />
      </div>
      <div style={styles.poInfo}>
        <div style={styles.poNumber}>{po.po_number}</div>
        <div style={styles.poMeta}>{po.vendor_name}</div>
        <div
          style={{
            ...styles.poBadge,
            background: `${statusColor}20`,
            color: statusColor
          }}
        >
          <ClipboardList size={12} />
          {itemCount} items
        </div>
      </div>
      <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
    </div>
  );
};

/**
 * Line item row
 */
const LineItemRow = ({ item, index, onClick, isReceived }) => {
  const remaining = item.quantity - (item.received || 0);
  const isComplete = remaining <= 0;

  return (
    <div
      style={{
        ...styles.lineItem,
        ...(isComplete ? styles.lineItemReceived : {}),
        ...(isComplete ? styles.lineItemDisabled : {})
      }}
      onClick={isComplete ? undefined : onClick}
    >
      <div style={styles.lineItemInfo}>
        <div style={styles.lineItemName}>{item.partName || item.description}</div>
        <div style={styles.lineItemMeta}>
          {item.partNumber && `#${item.partNumber} - `}
          Unit: {item.unit || 'ea'}
        </div>
      </div>
      <div style={styles.lineItemQty}>
        <div style={styles.lineItemQtyLabel}>
          {isComplete ? 'Complete' : 'Remaining'}
        </div>
        <div
          style={{
            ...styles.lineItemQtyValue,
            color: isComplete ? '#22c55e' : 'var(--text-primary)'
          }}
        >
          {isComplete ? <CheckCircle2 size={20} /> : remaining}
        </div>
      </div>
    </div>
  );
};

/**
 * Step header
 */
const StepHeader = ({ title, subtitle, onBack }) => (
  <div style={styles.stepHeader}>
    <button style={styles.backButton} onClick={onBack}>
      <ArrowLeft size={20} />
    </button>
    <div>
      <div style={styles.stepTitle}>{title}</div>
      {subtitle && <div style={styles.stepSubtitle}>{subtitle}</div>}
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InventoryReceiving() {
  const { worker, factoryId } = useWorkerAuth();
  const fileInputRef = useRef(null);

  // Step state
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_PO);

  // PO selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingPOs, setPendingPOs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPOs, setIsLoadingPOs] = useState(true);

  // Selected PO and line item
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [selectedLineItem, setSelectedLineItem] = useState(null);

  // Receive form
  const [quantityReceived, setQuantityReceived] = useState(0);
  const [quantityDamaged, setQuantityDamaged] = useState(0);
  const [hasDamage, setHasDamage] = useState(false);
  const [notes, setNotes] = useState('');
  const [damageNotes, setDamageNotes] = useState('');
  const [photos, setPhotos] = useState([]);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [receiptResult, setReceiptResult] = useState(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Load pending POs on mount
  useEffect(() => {
    const loadPendingPOs = async () => {
      if (!factoryId) return;
      setIsLoadingPOs(true);
      const { data } = await getPendingPurchaseOrders(factoryId);
      setPendingPOs(data || []);
      setIsLoadingPOs(false);
    };
    loadPendingPOs();
  }, [factoryId]);

  // Search POs with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2 && factoryId) {
        setIsSearching(true);
        const { data } = await searchPurchaseOrders(factoryId, searchQuery);
        setSearchResults(data || []);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, factoryId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectPO = async (po) => {
    // Fetch full PO details
    const { data } = await getPurchaseOrderById(po.id);
    if (data) {
      setSelectedPO(data);
      setCurrentStep(STEPS.VIEW_ITEMS);
    }
  };

  const handleSelectLineItem = (index) => {
    const item = selectedPO.line_items[index];
    setSelectedLineIndex(index);
    setSelectedLineItem(item);

    // Set initial quantity to remaining
    const remaining = item.quantity - (item.received || 0);
    setQuantityReceived(remaining);
    setQuantityDamaged(0);
    setHasDamage(false);
    setNotes('');
    setDamageNotes('');
    setPhotos([]);
    setError(null);

    setCurrentStep(STEPS.RECEIVE_ITEM);
  };

  const handleQuantityChange = (delta) => {
    const remaining = selectedLineItem.quantity - (selectedLineItem.received || 0);
    const newQty = Math.max(0, Math.min(remaining, quantityReceived + delta));
    setQuantityReceived(newQty);
  };

  const handlePhotoCapture = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPhotos = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const handleSubmitReceipt = async () => {
    if (quantityReceived <= 0) {
      setError('Please enter a quantity');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create receipt
      const { data: receipt, error: receiptError } = await createReceipt({
        factory_id: factoryId,
        po_id: selectedPO.id,
        po_line_index: selectedLineIndex,
        part_name: selectedLineItem.partName || selectedLineItem.description,
        part_number: selectedLineItem.partNumber,
        quantity_expected: selectedLineItem.quantity - (selectedLineItem.received || 0),
        quantity_received: quantityReceived,
        quantity_damaged: hasDamage ? quantityDamaged : 0,
        received_by: worker?.id,
        notes: notes || null,
        damage_notes: hasDamage ? damageNotes : null,
        photo_urls: []
      });

      if (receiptError) {
        setError(receiptError.message || 'Failed to create receipt');
        setIsSubmitting(false);
        return;
      }

      // Upload photos if any
      if (photos.length > 0 && receipt) {
        for (const photo of photos) {
          await uploadReceiptPhoto(receipt.id, photo.file);
        }
      }

      // Update local PO data
      const updatedLineItems = [...selectedPO.line_items];
      updatedLineItems[selectedLineIndex] = {
        ...updatedLineItems[selectedLineIndex],
        received: (updatedLineItems[selectedLineIndex].received || 0) + quantityReceived
      };
      setSelectedPO(prev => ({ ...prev, line_items: updatedLineItems }));

      // Set result and go to complete
      setReceiptResult({
        partName: selectedLineItem.partName || selectedLineItem.description,
        quantityReceived,
        quantityDamaged: hasDamage ? quantityDamaged : 0,
        status: hasDamage ? 'Damaged' : 'Received'
      });
      setCurrentStep(STEPS.COMPLETE);
    } catch (err) {
      console.error('Receipt error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setError(null);
    switch (currentStep) {
      case STEPS.VIEW_ITEMS:
        setSelectedPO(null);
        setCurrentStep(STEPS.SELECT_PO);
        break;
      case STEPS.RECEIVE_ITEM:
        setSelectedLineItem(null);
        setSelectedLineIndex(null);
        // Clear photos
        photos.forEach(p => URL.revokeObjectURL(p.preview));
        setPhotos([]);
        setCurrentStep(STEPS.VIEW_ITEMS);
        break;
      default:
        break;
    }
  };

  const handleContinueReceiving = () => {
    // Go back to line items to receive more
    setSelectedLineItem(null);
    setSelectedLineIndex(null);
    setReceiptResult(null);
    setCurrentStep(STEPS.VIEW_ITEMS);
  };

  const handleStartOver = () => {
    setCurrentStep(STEPS.SELECT_PO);
    setSelectedPO(null);
    setSelectedLineItem(null);
    setSelectedLineIndex(null);
    setSearchQuery('');
    setSearchResults([]);
    setReceiptResult(null);
    setError(null);
    photos.forEach(p => URL.revokeObjectURL(p.preview));
    setPhotos([]);
  };

  // ============================================================================
  // RENDER: Step 1 - Select PO
  // ============================================================================

  const renderSelectPO = () => (
    <div>
      <div style={styles.searchSection}>
        <div style={styles.searchInputWrapper}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search by PO number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isSearching && (
        <div style={styles.loadingContainer}>
          <Loader2 size={24} style={styles.spinner} />
        </div>
      )}

      {!isSearching && searchQuery.length >= 2 && searchResults.length > 0 && (
        <div>
          <div style={styles.sectionTitle}>Search Results</div>
          <div style={styles.poList}>
            {searchResults.map(po => (
              <POListItem
                key={po.id}
                po={po}
                onClick={() => handleSelectPO(po)}
              />
            ))}
          </div>
        </div>
      )}

      {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div style={styles.emptyState}>
          <Package size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3 }} />
          <p>No POs found matching "{searchQuery}"</p>
        </div>
      )}

      {searchQuery.length < 2 && (
        <>
          <div style={styles.sectionTitle}>Pending Deliveries</div>
          {isLoadingPOs ? (
            <div style={styles.loadingContainer}>
              <Loader2 size={24} style={styles.spinner} />
            </div>
          ) : pendingPOs.length > 0 ? (
            <div style={styles.poList}>
              {pendingPOs.map(po => (
                <POListItem
                  key={po.id}
                  po={po}
                  onClick={() => handleSelectPO(po)}
                />
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Truck size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3 }} />
              <p>No pending deliveries</p>
              <p style={{ fontSize: '0.813rem' }}>All POs have been received</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ============================================================================
  // RENDER: Step 2 - View Line Items
  // ============================================================================

  const renderViewItems = () => (
    <div>
      <StepHeader
        title={selectedPO?.po_number || 'PO Details'}
        subtitle={selectedPO?.vendor_name}
        onBack={handleBack}
      />

      <div style={styles.poDetailCard}>
        <div style={styles.poDetailHeader}>
          <div style={styles.poDetailIcon}>
            <Package size={24} />
          </div>
          <div style={styles.poDetailInfo}>
            <div style={styles.poDetailNumber}>{selectedPO?.po_number}</div>
            <div style={styles.poDetailVendor}>
              {selectedPO?.vendor_name} - {selectedPO?.project?.name}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.sectionTitle}>Line Items</div>
      <div style={styles.lineItemList}>
        {selectedPO?.line_items?.map((item, index) => (
          <LineItemRow
            key={index}
            item={item}
            index={index}
            onClick={() => handleSelectLineItem(index)}
            isReceived={(item.received || 0) >= item.quantity}
          />
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: Step 3 - Receive Item
  // ============================================================================

  const renderReceiveItem = () => {
    const remaining = selectedLineItem?.quantity - (selectedLineItem?.received || 0);

    return (
      <div>
        <StepHeader
          title="Receive Item"
          subtitle={selectedLineItem?.partName || selectedLineItem?.description}
          onBack={handleBack}
        />

        {/* Item info */}
        <div style={styles.poDetailCard}>
          <div style={{...styles.lineItemName, fontSize: '1.125rem', marginBottom: 'var(--space-sm)'}}>
            {selectedLineItem?.partName || selectedLineItem?.description}
          </div>
          <div style={styles.lineItemMeta}>
            {selectedLineItem?.partNumber && `Part #${selectedLineItem.partNumber}`}
          </div>
          <div style={{marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'space-between'}}>
            <div>
              <div style={styles.lineItemQtyLabel}>Expected</div>
              <div style={styles.lineItemQtyValue}>{remaining}</div>
            </div>
            <div>
              <div style={styles.lineItemQtyLabel}>Unit</div>
              <div style={styles.lineItemQtyValue}>{selectedLineItem?.unit || 'ea'}</div>
            </div>
          </div>
        </div>

        {/* Quantity control */}
        <div style={styles.formSection}>
          <label style={styles.formLabel}>Quantity Received</label>
          <div style={styles.quantityControl}>
            <button
              style={styles.quantityButton}
              onClick={() => handleQuantityChange(-1)}
            >
              <Minus size={20} />
            </button>
            <input
              type="number"
              style={styles.quantityInput}
              value={quantityReceived}
              onChange={(e) => setQuantityReceived(Math.max(0, Math.min(remaining, parseInt(e.target.value) || 0)))}
              min={0}
              max={remaining}
            />
            <button
              style={styles.quantityButton}
              onClick={() => handleQuantityChange(1)}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Damage toggle */}
        <div
          style={{
            ...styles.damageToggle,
            ...(hasDamage ? styles.damageToggleActive : {})
          }}
          onClick={() => setHasDamage(!hasDamage)}
        >
          <div
            style={{
              ...styles.toggleCheckbox,
              ...(hasDamage ? styles.toggleCheckboxActive : {})
            }}
          >
            {hasDamage && <CheckCircle2 size={14} color="white" />}
          </div>
          <div style={{flex: 1}}>
            <div style={{fontWeight: '500', color: 'var(--text-primary)'}}>Report Damage</div>
            <div style={{fontSize: '0.813rem', color: 'var(--text-secondary)'}}>
              Items arrived damaged or defective
            </div>
          </div>
          <AlertCircle size={20} color={hasDamage ? '#f59e0b' : 'var(--text-tertiary)'} />
        </div>

        {/* Damage quantity and notes */}
        {hasDamage && (
          <>
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Damaged Quantity</label>
              <input
                type="number"
                style={{...styles.quantityInput, width: '100%'}}
                value={quantityDamaged}
                onChange={(e) => setQuantityDamaged(Math.max(0, Math.min(quantityReceived, parseInt(e.target.value) || 0)))}
                min={0}
                max={quantityReceived}
              />
            </div>
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Damage Description</label>
              <textarea
                style={styles.textArea}
                placeholder="Describe the damage..."
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Notes */}
        <div style={styles.formSection}>
          <label style={styles.formLabel}>Notes (optional)</label>
          <textarea
            style={styles.textArea}
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Photos */}
        <div style={styles.photoSection}>
          <label style={styles.formLabel}>Photos (optional)</label>
          {photos.length > 0 && (
            <div style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <div key={index} style={styles.photoPreview}>
                  <img src={photo.preview} alt="" style={styles.photoImg} />
                  <button
                    style={styles.photoRemove}
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            style={{ display: 'none' }}
            onChange={handlePhotoCapture}
          />
          <button
            style={styles.addPhotoButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={20} />
            {photos.length > 0 ? 'Add More Photos' : 'Take Photo'}
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-lg)'
          }}>
            <AlertTriangle size={20} style={{color: '#ef4444', flexShrink: 0}} />
            <div style={{fontSize: '0.875rem', color: '#ef4444'}}>{error}</div>
          </div>
        )}

        <button
          style={{
            ...styles.actionButton,
            ...styles.primaryButton,
            ...(isSubmitting || quantityReceived <= 0 ? styles.disabledButton : {})
          }}
          onClick={handleSubmitReceipt}
          disabled={isSubmitting || quantityReceived <= 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} style={styles.spinner} />
              Receiving...
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              Confirm Receipt
            </>
          )}
        </button>
      </div>
    );
  };

  // ============================================================================
  // RENDER: Step 4 - Complete
  // ============================================================================

  const renderComplete = () => (
    <div style={styles.completeContainer}>
      <div style={styles.completeIcon}>
        <CheckCircle2 size={40} color="#22c55e" />
      </div>
      <div style={styles.completeTitle}>Item Received!</div>
      <div style={styles.completeMessage}>
        Successfully recorded receipt
      </div>

      {receiptResult && (
        <div style={styles.receiptSummary}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Item</span>
            <span style={styles.summaryValue}>{receiptResult.partName}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Quantity</span>
            <span style={styles.summaryValue}>{receiptResult.quantityReceived}</span>
          </div>
          {receiptResult.quantityDamaged > 0 && (
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Damaged</span>
              <span style={{...styles.summaryValue, color: '#f59e0b'}}>
                {receiptResult.quantityDamaged}
              </span>
            </div>
          )}
          <div style={{...styles.summaryRow, marginBottom: 0}}>
            <span style={styles.summaryLabel}>Status</span>
            <span
              style={{
                ...styles.summaryValue,
                color: getReceiptStatusColor(receiptResult.status)
              }}
            >
              {receiptResult.status}
            </span>
          </div>
        </div>
      )}

      <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%', maxWidth: '300px'}}>
        <button
          style={{...styles.actionButton, ...styles.primaryButton}}
          onClick={handleContinueReceiving}
        >
          Receive More from PO
        </button>
        <button
          style={{...styles.actionButton, ...styles.secondaryButton}}
          onClick={handleStartOver}
        >
          Select Different PO
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div style={styles.container}>
      {currentStep === STEPS.SELECT_PO && renderSelectPO()}
      {currentStep === STEPS.VIEW_ITEMS && renderViewItems()}
      {currentStep === STEPS.RECEIVE_ITEM && renderReceiveItem()}
      {currentStep === STEPS.COMPLETE && renderComplete()}
    </div>
  );
}
