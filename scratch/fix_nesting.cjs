const fs = require('fs');
const path = 'c:/Users/JOEL/Downloads/apco--main-ashwin-main/apco--main-ashwin-main/src/pages/ClientDetailsPage.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Target the block between "Synced via APCO Global Operations Registry" and "UNIFIED FINANCIAL BUILDER MODAL"
let syncIndex = lines.findIndex(l => l.includes('Synced via APCO Global Operations Registry'));
let modalIndex = lines.findIndex(l => l.includes('UNIFIED FINANCIAL BUILDER MODAL'));

if (syncIndex !== -1 && modalIndex !== -1) {
    const newClosingBlock = [
        '                          </div>',
        '                       </div>',
        '                    </>',
        '                 )}',
        '              </div>',
        '           </div>',
        '        )}',
        '     </div>',
        '',
        '      '
    ];
    // Replace everything from syncIndex+1 to modalIndex-1
    lines.splice(syncIndex + 1, modalIndex - syncIndex - 2, ...newClosingBlock);
    fs.writeFileSync(path, lines.join('\n'));
    console.log('Fixed ClientDetailsPage.tsx');
} else {
    console.log('Could not find markers', syncIndex, modalIndex);
}
