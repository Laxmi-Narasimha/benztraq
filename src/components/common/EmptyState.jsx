/**
 * Common Components: Empty State
 * 
 * Empty state displays for when there's no data.
 * 
 * @module components/common/EmptyState
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    FileText,
    BarChart3,
    Users,
    Package,
    Search,
    Plus,
} from 'lucide-react';

/**
 * Icon mapping for different entity types.
 */
const IconMap = {
    document: FileText,
    chart: BarChart3,
    customer: Users,
    product: Package,
    search: Search,
    default: FileText,
};

/**
 * EmptyState component.
 * 
 * @param {Object} props - Component props
 * @param {string} [props.title='No data found'] - Title text
 * @param {string} [props.description] - Description text
 * @param {string} [props.icon='default'] - Icon type to display
 * @param {Object} [props.action] - Action button config
 * @param {string} props.action.label - Button label
 * @param {Function} props.action.onClick - Click handler
 * @param {string} [props.className] - Additional CSS classes
 */
export function EmptyState({
    title = 'No data found',
    description,
    icon = 'default',
    action,
    className,
}) {
    const Icon = IconMap[icon] || IconMap.default;

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-12 px-4 text-center',
                className
            )}
        >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>

            <h3 className="text-lg font-semibold mb-1">{title}</h3>

            {description && (
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {description}
                </p>
            )}

            {action && (
                <Button onClick={action.onClick} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {action.label}
                </Button>
            )}
        </div>
    );
}

/**
 * Search empty state - specifically for search results.
 * 
 * @param {Object} props - Component props
 * @param {string} props.query - The search query that yielded no results
 */
export function SearchEmptyState({ query }) {
    return (
        <EmptyState
            icon="search"
            title="No results found"
            description={`We couldn't find any results for "${query}". Try adjusting your search or filters.`}
        />
    );
}

/**
 * Document empty state.
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Document type (quotation, sales_order, invoice)
 * @param {Function} [props.onAdd] - Handler for add button
 */
export function DocumentEmptyState({ type, onAdd }) {
    const typeLabels = {
        quotation: 'quotations',
        sales_order: 'sales orders',
        invoice: 'invoices',
    };

    const label = typeLabels[type] || 'documents';

    return (
        <EmptyState
            icon="document"
            title={`No ${label} yet`}
            description={`Start by uploading a PDF or creating a ${label.slice(0, -1)} manually.`}
            action={onAdd ? { label: `Add ${label.slice(0, -1)}`, onClick: onAdd } : undefined}
        />
    );
}

/**
 * Chart empty state.
 */
export function ChartEmptyState() {
    return (
        <EmptyState
            icon="chart"
            title="No data to display"
            description="There's not enough data to generate this chart. Add some documents to see analytics."
        />
    );
}
