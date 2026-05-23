# Phase 5: Search System - Research

**Researched:** 2026-03-11
**Domain:** Meilisearch integration with product catalog
**Confidence:** HIGH

## Summary

Meilisearch v1.37 (released March 2026) is the standard solution for fast, typo-tolerant search in modern web applications. The integration involves three components: (1) Meilisearch instance running via Docker Compose, (2) backend sync service using meilisearch-js SDK to keep the search index synchronized with PostgreSQL product catalog, and (3) frontend search UI using React InstantSearch with instant-meilisearch adapter. The architecture follows an event-driven pattern where product CRUD operations trigger index updates, faceted search provides filter counts, and admin settings (synonyms, stop words, ranking rules) are configurable via API.

Meilisearch delivers sub-100ms search responses with built-in typo tolerance, synonym support, and faceted search. The technology is production-proven, self-hosted (no vendor lock-in), and optimized for e-commerce product catalogs with millions of documents. Key architectural decisions include batch indexing for performance (10,000-50,000 documents per batch), auto-batching for consecutive operations, and separation of searchable attributes to reduce index size.

**Primary recommendation:** Use Meilisearch v1.37+ with Docker Compose for infrastructure, meilisearch-js v0.44+ for backend synchronization service, and react-instantsearch v7+ with @meilisearch/instant-meilisearch v0.16+ for frontend autocomplete. Configure searchable attributes (name, description, SKU, brand, category) and filterable attributes (categoryId, brandId, status, price) before first indexing to avoid expensive re-indexing.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-01 | Meilisearch instance configured and synced with product catalog | Docker Compose setup with persistent volumes, meilisearch-js SDK for sync service, webhook/event-driven sync patterns |
| SRCH-02 | Client app provides search-as-you-type with autocomplete suggestions (<100ms response) | React InstantSearch with instant-meilisearch adapter, SearchBox and Hits components, Meilisearch delivers <50ms queries |
| SRCH-03 | Search supports full-text across product name, description, SKU, brand, category | searchableAttributes configuration, attribute ranking rules, join with Brand/Category for denormalized search documents |
| SRCH-04 | Search has typo tolerance and synonym mapping | Built-in typo tolerance (configurable minWordSizeForTypos), synonyms API for admin configuration |
| SRCH-05 | Search results include facet counts for dynamic filtering | facets parameter returns facetDistribution with counts, filterableAttributes configuration required |
| SRCH-06 | Admin can configure search settings (synonyms, stop words, ranking rules) | Settings API endpoints for synonyms, stopWords, rankingRules - admin UI calls these endpoints |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| meilisearch | v1.37+ | Search engine server | Latest stable with HNSW vector store, 7x faster indexing, replicated sharding support |
| meilisearch (npm) | v0.44+ | Node.js SDK | Official JavaScript/TypeScript client, supports Node.js LTS versions, full API coverage |
| @meilisearch/instant-meilisearch | v0.16+ | InstantSearch adapter | Official bridge between Meilisearch and Algolia's InstantSearch UI framework |
| react-instantsearch | v7+ | Frontend search UI | Industry-standard search UI components (SearchBox, Hits, RefinementList, Pagination) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| instantsearch.css | latest | Default styling | Quick prototyping - provides base styles for InstantSearch components |
| @meilisearch/autocomplete-client | v0.7+ | Autocomplete widget | Alternative to InstantSearch - use for custom autocomplete without full InstantSearch framework |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Meilisearch | Elasticsearch | Elasticsearch requires more infrastructure complexity, higher resource usage, slower setup - Meilisearch optimized for instant search use case |
| Meilisearch | Algolia | Algolia is SaaS-only (no self-hosting), expensive at scale, vendor lock-in - Meilisearch is free and open-source |
| Meilisearch | Typesense | Similar feature set, but Meilisearch has better React ecosystem, more mature, larger community |
| react-instantsearch | Custom UI | Building custom search UI requires handling debouncing, pagination, filters, facets - InstantSearch provides battle-tested components |

**Installation:**
```bash
# Backend (apps/server)
pnpm add meilisearch

# Frontend (apps/client)
pnpm add react-instantsearch @meilisearch/instant-meilisearch instantsearch.css
```

**Docker Compose addition:**
```yaml
meilisearch:
  image: getmeili/meilisearch:v1.37
  container_name: ecom-meilisearch
  restart: unless-stopped
  environment:
    MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    MEILI_ENV: ${MEILI_ENV:-development}
  ports:
    - '7700:7700'
  volumes:
    - meilisearch_data:/meili_data
```

## Architecture Patterns

### Recommended Project Structure
```
apps/server/src/
├── modules/
│   └── search/
│       ├── search.service.ts        # Meilisearch client singleton, index operations
│       ├── search.controller.ts     # Admin settings endpoints (synonyms, stopWords, rankingRules)
│       ├── sync.service.ts          # Product -> Meilisearch sync logic
│       └── types.ts                 # SearchDocument type definition
apps/client/src/
├── components/
│   └── search/
│       ├── search-bar.tsx           # InstantSearch wrapper with SearchBox
│       ├── search-results.tsx       # Hits component with product cards
│       ├── search-autocomplete.tsx  # Autocomplete dropdown
│       └── search-facets.tsx        # RefinementList for filters
```

### Pattern 1: Event-Driven Index Synchronization
**What:** Product CRUD operations in PostgreSQL trigger corresponding index updates in Meilisearch
**When to use:** Real-time search index consistency without polling or scheduled jobs
**Example:**
```typescript
// Source: Meilisearch best practices pattern
// apps/server/src/modules/product/product.service.ts

import { SearchService } from '../search/search.service';

export class ProductService {
  constructor(
    private prisma: PrismaClient,
    private searchService: SearchService
  ) {}

  async createProduct(data: CreateProductDto) {
    // Create in PostgreSQL
    const product = await this.prisma.product.create({
      data,
      include: { category: true, brand: true }
    });

    // Sync to Meilisearch (fire and forget - async indexing)
    this.searchService.indexProduct(product).catch(err =>
      console.error('Search index update failed:', err)
    );

    return product;
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: { category: true, brand: true }
    });

    this.searchService.indexProduct(product).catch(err =>
      console.error('Search index update failed:', err)
    );

    return product;
  }

  async deleteProduct(id: string) {
    await this.prisma.product.delete({ where: { id } });
    this.searchService.deleteProduct(id).catch(err =>
      console.error('Search index delete failed:', err)
    );
  }
}
```

### Pattern 2: Denormalized Search Documents
**What:** Flatten related data (brand, category) into search documents for faster queries
**When to use:** Always - Meilisearch doesn't support joins, denormalization is required
**Example:**
```typescript
// Source: Meilisearch documentation on document structure
// apps/server/src/modules/search/types.ts

export interface SearchDocument {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  images: string[];
  status: string;
  productType: string;

  // Denormalized relations for search
  brandId: string | null;
  brandName: string | null;
  categoryId: string;
  categoryName: string;
  categoryPath: string; // "/electronics/phones/smartphones"

  // Timestamps for sorting
  createdAt: number; // Unix timestamp
  updatedAt: number;
}

// apps/server/src/modules/search/sync.service.ts
export class SyncService {
  async buildSearchDocument(product: ProductWithRelations): Promise<SearchDocument> {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price,
      images: product.images,
      status: product.status,
      productType: product.productType,
      brandId: product.brandId,
      brandName: product.brand?.name ?? null,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      categoryPath: product.category.path,
      createdAt: product.createdAt.getTime(),
      updatedAt: product.updatedAt.getTime()
    };
  }
}
```

### Pattern 3: Batch Initial Sync
**What:** Sync entire product catalog in batches during initial setup or full re-sync
**When to use:** First-time index population, or after schema changes requiring re-indexing
**Example:**
```typescript
// Source: Meilisearch indexing best practices
// apps/server/src/modules/search/sync.service.ts

export class SyncService {
  async fullSync() {
    const BATCH_SIZE = 10000; // Recommended: 10k-50k per batch
    let cursor = 0;
    let hasMore = true;

    while (hasMore) {
      const products = await this.prisma.product.findMany({
        skip: cursor,
        take: BATCH_SIZE,
        include: { category: true, brand: true },
        where: { status: 'ACTIVE' } // Only index active products
      });

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      const searchDocs = products.map(p => this.buildSearchDocument(p));

      // Add documents in batch (returns task UID)
      const task = await this.searchService.addDocuments(searchDocs);

      // Optional: poll task status for monitoring
      await this.searchService.waitForTask(task.taskUid);

      cursor += BATCH_SIZE;
      console.log(`Synced ${cursor} products`);
    }
  }
}
```

### Pattern 4: React InstantSearch Integration
**What:** Wrap search UI in InstantSearch provider with Meilisearch client
**When to use:** All search interfaces (header search bar, dedicated search page)
**Example:**
```typescript
// Source: https://www.meilisearch.com/docs/guides/front_end/react_quick_start
// apps/client/src/components/search/search-bar.tsx

import { InstantSearch, SearchBox, Hits } from 'react-instantsearch';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';

const searchClient = instantMeiliSearch(
  'http://localhost:7700', // Meilisearch host
  'PUBLIC_SEARCH_KEY' // Use search-only API key (not master key)
);

export function SearchBar() {
  return (
    <InstantSearch
      indexName="products"
      searchClient={searchClient}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <SearchBox
        placeholder="Search products..."
        classNames={{
          input: 'search-input',
          submit: 'search-submit',
          reset: 'search-reset'
        }}
      />
      <Hits
        hitComponent={ProductHit}
        classNames={{
          list: 'search-results-list',
          item: 'search-result-item'
        }}
      />
    </InstantSearch>
  );
}

function ProductHit({ hit }: { hit: SearchDocument }) {
  return (
    <a href={`/products/${hit.id}`} className="hit">
      <img src={hit.images[0]} alt={hit.name} />
      <div>
        <h3>{hit.name}</h3>
        <p>${(hit.price / 100).toFixed(2)}</p>
      </div>
    </a>
  );
}
```

### Pattern 5: Index Configuration on Startup
**What:** Configure index settings (searchableAttributes, filterableAttributes, ranking rules) before first indexing
**When to use:** Always - configuring after documents are indexed triggers expensive re-indexing
**Example:**
```typescript
// Source: Meilisearch indexing best practices
// apps/server/src/modules/search/search.service.ts

export class SearchService {
  private client: MeiliSearch;
  private index: Index;

  async initializeIndex() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_MASTER_KEY
    });

    this.index = this.client.index('products');

    // Configure settings BEFORE adding documents
    await this.index.updateSettings({
      searchableAttributes: [
        'name',           // Most important - searched first
        'brandName',
        'categoryName',
        'description',
        'sku'
      ],
      filterableAttributes: [
        'categoryId',
        'brandId',
        'status',
        'price',
        'productType',
        'categoryPath'
      ],
      sortableAttributes: [
        'price',
        'createdAt',
        'updatedAt',
        'name'
      ],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness'
      ],
      faceting: {
        maxValuesPerFacet: 100,
        sortFacetValuesBy: { '*': 'count' } // Sort facets by count descending
      },
      pagination: {
        maxTotalHits: 1000 // Limit for performance
      },
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 5,  // 5+ chars = 1 typo allowed
          twoTypos: 9  // 9+ chars = 2 typos allowed
        }
      }
    });
  }
}
```

### Anti-Patterns to Avoid
- **Using master key on frontend:** Never expose MEILI_MASTER_KEY to client - create search-only API key with limited permissions
- **Synchronous index updates:** Don't await index operations in request handlers - fire and forget or use background jobs
- **Configuring settings after indexing:** Settings changes trigger full re-index - configure once upfront
- **Making everything filterable:** Only add truly filterable fields to filterableAttributes - each one increases index size
- **Polling for real-time sync:** Use event-driven sync (create/update/delete hooks) instead of scheduled polling
- **Ignoring task status:** Meilisearch operations are async - check task status for critical operations (migrations, initial sync)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Search autocomplete UI | Custom debounced input with fetch | react-instantsearch SearchBox | Handles debouncing, query state, keyboard navigation, accessibility, loading states |
| Faceted filtering | Custom checkbox filters with URL sync | react-instantsearch RefinementList | Built-in facet counts, multi-select, URL persistence, loading states |
| Search result highlighting | Manual string matching and HTML injection | Meilisearch built-in highlighting | XSS-safe, handles typos, configures via attributesToHighlight |
| Typo tolerance algorithm | Levenshtein distance or fuzzy matching | Meilisearch built-in typo tolerance | Production-tested, configurable per word length, integrated with ranking |
| Synonym management | Database table with manual query expansion | Meilisearch synonyms API | Bidirectional, integrated with search ranking, admin configurable |
| Product catalog denormalization | Manual SQL views or triggers | Application-layer sync service | More maintainable, easier to debug, handles complex joins |

**Key insight:** Meilisearch + InstantSearch ecosystem provides production-grade solutions for 95% of e-commerce search needs. Custom solutions appear simple ("just search the database") but fail on typos, performance at scale, relevancy ranking, and UX complexity (autocomplete, facets, infinite scroll, query suggestions).

## Common Pitfalls

### Pitfall 1: Nested Object Field Explosion
**What goes wrong:** Indexing products with deeply nested objects (variants, bundles) causes documents to exceed 65,535 field limit
**Why it happens:** Meilisearch automatically flattens nested objects - each nested path becomes a field (e.g., `variants[0].options[0].value`, `variants[1].options[0].value`)
**How to avoid:** Denormalize only essential search fields - store variant/bundle data in PostgreSQL, not Meilisearch. For variable products, index base product with primary variant data only.
**Warning signs:** Error "document contains more than 65535 fields" during indexing, memory spikes, slow indexing

### Pitfall 2: Master Key Exposure
**What goes wrong:** Leaking MEILI_MASTER_KEY to frontend allows anyone to delete indexes, modify settings, or access all data
**Why it happens:** Using master key directly in InstantSearch client instead of creating search-only API key
**How to avoid:** Generate search-only API key with limited permissions (`indexes: ['products'], actions: ['search']`), use on frontend. Keep master key server-side only.
**Warning signs:** Master key in environment variables loaded by Next.js client bundle (NEXT_PUBLIC_*), exposed in network requests

### Pitfall 3: Post-Index Settings Changes
**What goes wrong:** Updating searchableAttributes or filterableAttributes after indexing triggers full re-index, causing downtime and memory spikes
**Why it happens:** Not configuring index settings before first document addition
**How to avoid:** Call `updateSettings()` in initialization script before any `addDocuments()` calls. For production changes, use zero-downtime index swap.
**Warning signs:** Long indexing times after settings changes, memory usage spikes, "indexing" tasks queued for hours

### Pitfall 4: Synchronous Index Updates in Request Handlers
**What goes wrong:** Awaiting Meilisearch index operations in product create/update endpoints causes slow responses (2-5 seconds)
**Why it happens:** Treating Meilisearch updates like database transactions - indexing is intentionally async
**How to avoid:** Fire-and-forget index updates (don't await), or use background job queue for critical operations
**Warning signs:** API endpoints taking >1 second, request timeouts, users reporting slow product saves

### Pitfall 5: Missing Auto-Batching Benefits
**What goes wrong:** Sending individual `addDocuments([product])` calls for each product during bulk import - 100x slower than batching
**Why it happens:** Not understanding Meilisearch's auto-batching - it batches consecutive operations, but single-document calls don't benefit
**How to avoid:** Batch 10,000-50,000 documents per `addDocuments()` call during initial sync or imports
**Warning signs:** Bulk product import taking hours instead of minutes, CPU usage low during import, task queue growing linearly

### Pitfall 6: Development vs Production Environment Confusion
**What goes wrong:** Running Meilisearch in production without MEILI_MASTER_KEY (development mode) - zero security
**Why it happens:** Not setting `MEILI_ENV=production` environment variable, which requires master key
**How to avoid:** Always set `MEILI_ENV=production` and `MEILI_MASTER_KEY` (16+ bytes) in production Docker Compose
**Warning signs:** Meilisearch accepting unauthenticated requests, no API key required for admin operations

### Pitfall 7: Volume Mount Performance Loss
**What goes wrong:** Using Docker bind mounts (`./data:/meili_data`) instead of named volumes - indexing 10x slower on macOS
**Why it happens:** Docker Desktop file sharing has poor I/O performance for host mounts
**How to avoid:** Use named Docker volumes (`meilisearch_data:/meili_data`) in docker-compose.yml
**Warning signs:** Slow indexing on macOS/Windows, fast on Linux, high disk I/O wait times

## Code Examples

Verified patterns from official sources:

### Meilisearch Client Initialization
```typescript
// Source: https://github.com/meilisearch/meilisearch-js
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_MASTER_KEY
});

const index = client.index('products');
```

### Creating Search-Only API Key
```typescript
// Source: https://www.meilisearch.com/docs/learn/security/managing_api_keys
// One-time script or admin endpoint
const key = await client.createKey({
  description: 'Search key for client app',
  actions: ['search'],
  indexes: ['products'],
  expiresAt: null // Never expires
});

console.log('Public search key:', key.key);
// Store key.key in NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY
```

### Admin Synonyms Configuration
```typescript
// Source: https://www.meilisearch.com/docs/learn/relevancy/synonyms
// apps/server/src/modules/search/search.controller.ts
export class SearchController {
  async updateSynonyms(synonyms: Record<string, string[]>) {
    // Example: { "phone": ["smartphone", "mobile"], "tv": ["television"] }
    await this.searchService.updateSynonyms(synonyms);
    return { success: true };
  }

  async updateStopWords(stopWords: string[]) {
    // Example: ["the", "a", "an", "and", "or", "but"]
    await this.searchService.updateStopWords(stopWords);
    return { success: true };
  }

  async updateRankingRules(rules: string[]) {
    // Default: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness']
    // Custom: ['words', 'typo', 'proximity', 'price:asc', 'attribute', 'exactness']
    await this.searchService.updateRankingRules(rules);
    return { success: true };
  }
}
```

### Faceted Search Query
```typescript
// Source: https://www.meilisearch.com/docs/learn/filtering_and_sorting/search_with_facet_filters
const results = await index.search('laptop', {
  facets: ['brandName', 'categoryName', 'price'],
  filter: [
    ['categoryPath = /electronics/computers'],
    ['price >= 50000', 'price <= 150000'] // AND within group, OR across groups
  ],
  attributesToHighlight: ['name', 'description'],
  limit: 20
});

// results.facetDistribution:
// {
//   brandName: { "Apple": 5, "Dell": 8, "HP": 12 },
//   categoryName: { "Laptops": 25 },
//   price: { "50000-100000": 15, "100000-150000": 10 }
// }
```

### React InstantSearch with Facets
```typescript
// Source: https://www.meilisearch.com/docs/guides/front_end/react_quick_start
import { InstantSearch, SearchBox, Hits, RefinementList } from 'react-instantsearch';

export function SearchPage() {
  return (
    <InstantSearch indexName="products" searchClient={searchClient}>
      <div className="search-container">
        <aside>
          <RefinementList attribute="brandName" />
          <RefinementList attribute="categoryName" />
        </aside>
        <main>
          <SearchBox />
          <Hits hitComponent={ProductCard} />
        </main>
      </div>
    </InstantSearch>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PostgreSQL full-text search | Meilisearch dedicated search engine | 2020+ | 10-100x faster queries, typo tolerance, better relevancy, faceted search built-in |
| Manual debounced fetch | React InstantSearch | 2021+ | Production-grade UI components, keyboard navigation, accessibility, URL sync |
| Algolia SaaS | Self-hosted Meilisearch | 2021+ | No vendor lock-in, free for unlimited documents, data privacy |
| Legacy vector store | HNSW vector store (v1.37) | March 2026 | 30% smaller database, 7x faster indexing, required migration for semantic search |
| Manual batching | Auto-batching | v0.30+ (2022) | Consecutive operations batched automatically, 5-10x faster bulk imports |
| Dump-based upgrades | Dumpless upgrades (experimental) | v1.36+ (2026) | Faster major version upgrades, but not atomic - risky for production |

**Deprecated/outdated:**
- **Algolia DocSearch**: Algolia-hosted search solution - now Meilisearch can replace it with self-hosted alternative
- **Legacy vector store**: Removed in v1.37 - all indexes migrated to HNSW automatically on upgrade
- **vectorStoreSetting**: Experimental feature removed in v1.37 - HNSW is now default and only option

## Open Questions

1. **Real-time sync reliability under high load**
   - What we know: Event-driven sync works for normal operations, auto-batching handles consecutive updates
   - What's unclear: Best strategy when product catalog receives 1000+ updates/minute (flash sale, inventory sync)
   - Recommendation: Implement retry queue with exponential backoff for failed index operations, monitor Meilisearch task queue length

2. **Search result ranking for multi-type products**
   - What we know: Ranking rules are global per index, searchableAttributes order determines attribute ranking
   - What's unclear: How to boost SIMPLE products over VARIABLE in search results without creating separate indexes
   - Recommendation: Use custom ranking rule based on productType field if needed, or accept default relevancy

3. **Facet performance with 100+ brand/category values**
   - What we know: maxValuesPerFacet default is 100, facets update in real-time even with millions of documents
   - What's unclear: UI/UX pattern for displaying 500+ brands without overwhelming users
   - Recommendation: Use RefinementList with search input (InstantSearch supports facet search), or limit to top 50 + "Show more"

4. **Version upgrade strategy for production**
   - What we know: Dumpless upgrades are experimental, dump-based upgrades require downtime and memory spike
   - What's unclear: Zero-downtime upgrade pattern for large catalogs (1M+ products)
   - Recommendation: Blue-green deployment with two Meilisearch instances, or scheduled maintenance window for dump import

## Validation Architecture

> Nyquist validation is enabled for this project.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts (workspace root) |
| Quick run command | `pnpm test search` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | Meilisearch syncs on product create/update/delete | integration | `vitest apps/server/src/modules/search/sync.service.test.ts -x` | ❌ Wave 0 |
| SRCH-01 | Initial batch sync completes without errors | integration | `vitest apps/server/src/modules/search/sync.service.test.ts::fullSync -x` | ❌ Wave 0 |
| SRCH-02 | SearchBox component renders and accepts input | unit | `vitest apps/client/src/components/search/search-bar.test.tsx -x` | ❌ Wave 0 |
| SRCH-02 | Search returns results in <100ms (manual timing check) | manual-only | N/A | Manual: Verify in browser DevTools Network tab |
| SRCH-03 | Search finds products by name, description, SKU | integration | `vitest apps/server/src/modules/search/search.service.test.ts::searchFields -x` | ❌ Wave 0 |
| SRCH-03 | Search includes brand and category data | integration | `vitest apps/server/src/modules/search/search.service.test.ts::denormalization -x` | ❌ Wave 0 |
| SRCH-04 | Typo tolerance finds "iphone" when searching "iphon" | integration | `vitest apps/server/src/modules/search/search.service.test.ts::typoTolerance -x` | ❌ Wave 0 |
| SRCH-04 | Synonyms work ("phone" finds "smartphone") | integration | `vitest apps/server/src/modules/search/search.service.test.ts::synonyms -x` | ❌ Wave 0 |
| SRCH-05 | facetDistribution returns brand/category counts | integration | `vitest apps/server/src/modules/search/search.service.test.ts::facets -x` | ❌ Wave 0 |
| SRCH-06 | Admin can update synonyms via API | integration | `vitest apps/server/src/modules/search/search.controller.test.ts::updateSynonyms -x` | ❌ Wave 0 |
| SRCH-06 | Admin can update stop words via API | integration | `vitest apps/server/src/modules/search/search.controller.test.ts::updateStopWords -x` | ❌ Wave 0 |
| SRCH-06 | Admin can update ranking rules via API | integration | `vitest apps/server/src/modules/search/search.controller.test.ts::updateRankingRules -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test search` (runs all search-related tests in <30 seconds)
- **Per wave merge:** `pnpm test` (full suite including existing product/auth tests)
- **Phase gate:** Full suite green + manual performance check (<100ms) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/server/src/modules/search/sync.service.test.ts` — covers SRCH-01 sync behavior
- [ ] `apps/server/src/modules/search/search.service.test.ts` — covers SRCH-03, SRCH-04, SRCH-05 search functionality
- [ ] `apps/server/src/modules/search/search.controller.test.ts` — covers SRCH-06 admin settings
- [ ] `apps/client/src/components/search/search-bar.test.tsx` — covers SRCH-02 React component
- [ ] Mock Meilisearch client in `vitest.setup.ts` — prevents real Meilisearch calls in tests

## Sources

### Primary (HIGH confidence)
- [Meilisearch Docker Documentation](https://www.meilisearch.com/docs/guides/docker) - Docker setup and configuration
- [Meilisearch JS SDK Repository](https://github.com/meilisearch/meilisearch-js) - Official Node.js client API and usage
- [React InstantSearch Quick Start](https://www.meilisearch.com/docs/guides/front_end/react_quick_start) - React integration patterns
- [Meilisearch Indexing Best Practices](https://www.meilisearch.com/docs/learn/indexing/indexing_best_practices) - Performance optimization
- [Meilisearch Typo Tolerance Settings](https://www.meilisearch.com/docs/learn/relevancy/typo_tolerance_settings) - Typo configuration
- [Meilisearch Faceted Search](https://www.meilisearch.com/docs/learn/filtering_and_sorting/search_with_facet_filters) - Facet implementation
- [Meilisearch Security Documentation](https://www.meilisearch.com/docs/learn/security/basic_security) - API key management
- [Meilisearch Ranking Rules](https://www.meilisearch.com/docs/learn/relevancy/ranking_rules) - Relevancy configuration

### Secondary (MEDIUM confidence)
- [Meilisearch January 2026 Updates](https://www.meilisearch.com/blog/January-2026-updates) - Latest features and dynamic sharding
- [Meilisearch v1.37 Release Notes](https://github.com/meilisearch/meilisearch/releases) - Version-specific changes
- [Indexing Optimization Guide](https://www.meilisearch.com/blog/indexing-optimization-guide) - Performance best practices
- [Zero Downtime Index Deployment](https://www.meilisearch.com/blog/zero-downtime-index-deployment) - Production deployment patterns
- [Meilisearch Migration Tools](https://github.com/meilisearch/meilisearch-migration) - Version upgrade scripts
- [Meilisync GitHub Repository](https://github.com/long2ice/meilisync) - Third-party database sync tool

### Tertiary (LOW confidence)
- [MeiliSearch Indexing Best Practices (DEV.to)](https://dev.to/shrsv/meilisearch-indexing-best-practices-1k3p) - Community best practices
- [Meilisearch Docker Compose Examples](https://www.strangebuzz.com/en/snippets/docker-compose-file-for-meilisearch) - Community configurations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Meilisearch documentation, npm packages, and GitHub repositories
- Architecture: HIGH - Verified patterns from official React InstantSearch guide and Meilisearch best practices
- Pitfalls: HIGH - Documented in official troubleshooting guides and GitHub issues
- Performance: HIGH - Official indexing optimization guide and release notes
- Security: HIGH - Official security documentation and API key specifications
- Testing: MEDIUM - General Vitest patterns applied to Meilisearch context, no official test examples found

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days - Meilisearch is stable, but fast-moving with monthly releases)
