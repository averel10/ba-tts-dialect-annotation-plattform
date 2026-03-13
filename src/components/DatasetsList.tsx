'use server';

import db from '@/lib/db';
import { dataset } from '@/lib/model/dataset';
import Link from 'next/link';

export default async function DatasetsList() {
  const datasets = await db.select().from(dataset).orderBy(dataset.createdAt);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Datasets</h2>
      {datasets.length === 0 ? (
        <p className="text-gray-500">No datasets found.</p>
      ) : (
        <div className="grid gap-4">
          {datasets.map((ds) => (
            <Link
              key={ds.id}
              href={`/admin/datasets/${ds.id}`}
              className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow block cursor-pointer"
            >
              <h3 className="text-lg font-semibold">{ds.name}</h3>
              <p className="text-md text-gray-600">{ds.description}</p>
              <p className="text-sm text-gray-600 mt-2">
                ID: {ds.id}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Created: {new Date(ds.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
