import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { patch, get } from '@/app/lib/fetchServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const expenseReport = await get(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports?event=${params.slug}`);
    return NextResponse.json(expenseReport);
  } catch (error) {
    console.error('Erreur lors de la récupération de la note de frais:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la note de frais' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    const { status, comment } = body;

    const expenseReport = await patch(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports?event=${params.slug}`, {
      status,
      ...(comment && { comment }),
    });

    return NextResponse.json(expenseReport);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note de frais:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la note de frais' },
      { status: 500 }
    );
  }
} 