'use server';

import db from '@/lib/db';
import { experiment } from '@/lib/model/experiment';
import { dataset } from '@/lib/model/dataset';
import Link from 'next/link';

export default async function ExperimentsList() {
  const experiments = await db
    .select()
    .from(experiment)
    .orderBy(experiment.createdAt);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Experiments</h2>
      {experiments.length === 0 ? (
        <p className="text-gray-500">No experiments found.</p>
      ) : (
        <div className="grid gap-4">
          {experiments.map((exp) => (
            <Link
              key={exp.id}
              href={`/admin/experiments/${exp.id}`}
              className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow block cursor-pointer"
            >
              <h3 className="text-lg font-semibold">{exp.name}</h3>
              <p className="text-md text-gray-600">{exp.description}</p>
              <p className="text-sm text-gray-600 mt-2">
                ID: {exp.id} | Dataset ID: {exp.datasetId}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Created: {new Date(exp.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
