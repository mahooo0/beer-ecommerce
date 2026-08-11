import { getUserDetail } from '../actions';
import { requireAdmin } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { UserDetailClient, type UserDetailData } from './user-detail-client';

type Params = Promise<{
  id: string;
}>;

export default async function UserDetailPage({ params }: { params: Params }) {
  await requireAdmin();

  const { id } = await params;
  const user = await getUserDetail(id);

  if (!user) {
    notFound();
  }

  // Normalize into a serializable, client-friendly shape (dates → ISO strings).
  const data: UserDetailData = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar ?? null,
    phone: user.phone ?? null,
    isActive: user.isActive,
    banned: user.banned,
    inDb: user.inDb,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
    counts: {
      reviews: user._count.reviews,
      wishlists: user._count.wishlists,
    },
    addresses: user.addresses.map((a) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      street: a.street,
      street2: a.street2 ?? null,
      city: a.city,
      state: a.state,
      zipCode: a.zipCode,
      country: a.country,
      phone: a.phone ?? null,
      isDefault: a.isDefault,
      label: a.label ?? null,
    })),
  };

  return <UserDetailClient user={data} />;
}
