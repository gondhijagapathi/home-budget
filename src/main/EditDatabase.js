import * as React from 'react';
import AddCategoryCard from './components/AddCategoryCard';
import AddSubCategoryCard from './components/AddSubCategoryCard';
import CategoryListCard from './components/CategoryListCard';
import SubCategoryListCard from './components/SubCategoryListCard';
import AddIncomeSourceCard from './components/AddIncomeSourceCard';
import IncomeSourceListCard from './components/IncomeSourceListCard';
import BackupRestoreCard from './components/BackupRestoreCard';

function EditDatabase() {
    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {/* Add Category */}
                <AddCategoryCard />

                {/* Add Subcategory */}
                <AddSubCategoryCard />

                {/* Add Income Source */}
                <AddIncomeSourceCard />

                {/* View & Edit Categories */}
                <CategoryListCard />

                {/* View & Edit Subcategories */}
                <SubCategoryListCard />

                {/* View & Edit Income Sources */}
                <IncomeSourceListCard />
            </div>

            {/* Backup & Restore - Full width independent card */}
            <div className="w-full">
                <BackupRestoreCard />
            </div>

        </div >
    );
}

export default EditDatabase;