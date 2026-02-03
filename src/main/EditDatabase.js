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
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {/* Add Category */}
            <AddCategoryCard />

            {/* Backup & Restore */}
            <BackupRestoreCard />

            {/* Add Subcategory */}
            <AddSubCategoryCard />

            {/* Add Income Source */}
            <AddIncomeSourceCard />

            {/* Spacer or another small card could go here to balance grid if needed, 
                but 3 small cards is fine. Next is full width lists usually. 
            */}
            <div className="hidden 2xl:block"></div> { /* Spacer for 4-col layout */}

            {/* View & Edit Categories */}
            <CategoryListCard />

            {/* View & Edit Subcategories */}
            <SubCategoryListCard />

            {/* View & Edit Income Sources */}
            <IncomeSourceListCard />
        </div>
    );
}

export default EditDatabase;