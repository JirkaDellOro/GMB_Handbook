import { fullSPOinfo, spoTableInfo } from "../../SPO_STATIC_INFOS";
import { applyVerticalAlignment } from "./ModuleManuals_Utility";

/** Table for pages with the module structure (not automatically breaking) */
export const ModManPage_StructureTable = (spoInfo: fullSPOinfo, labelEnum: any, maxColSpan: number) => {
    let stacks: any[] = [];
    let topPad = 5;
    let generalFontSize = 7;
    stacks.push({ text: labelEnum.table1_label, style: "footnote", color: "#333", fontSize: 7.5, id: "tableLabel-1" });

    let tableRows: any[] = [];
    let headerRow: any[] = [{
        text: `${labelEnum.module} /
Semester`, bold: true, alignment: "center", colSpan: 1, id: "tableHeader-1"
    }];
    for (let i = 0; i < maxColSpan; i++) {
        headerRow.push(
            { text: `${i + 1}`, bold: true, alignment: "center", colSpan: 1, fontSize: generalFontSize }
        )
    }
    tableRows.push(headerRow);

    let semesters: spoTableInfo[][] = [];
    spoInfo.courseInfo.moduleStructureInfo.forEach((inf: spoTableInfo) => {
        if (inf.semester) {
            if (!semesters[inf.semester]) //if semester not already instantiate, create before pushing
                semesters[inf.semester] = [];
            semesters[inf.semester].push(inf);
        }
    });
    semesters = semesters.reverse(); //From last to first semester, the table is top to bottom

    semesters.forEach((sem, i) => {
        sem = sem.sort((a, b) => a.order > b.order ? 1 : a.order < b.order ? -1 : 0); //make sure they are in order
        let row: any[] = [{ text: `${semesters.length - 1 - i}`, colSpan: 1, alignment: "center", fillColor: "#eee", bold: true, fontSize: 8 }];
        let sumColspan = 1;
        sem.forEach(mod => {
            sumColspan += mod.width;
            if (mod.text.length > 12) {
                let splitParts = mod.text.split(" ");
                splitParts.forEach(p => {
                    if (p.length > 15)
                        generalFontSize = 6.25;
                });
            }

            let obj = { text: mod.text.trim(), colSpan: mod.width, alignment: "center", fontSize: generalFontSize };
            if (mod.bgColor)
                (obj as any).fillColor = mod.bgColor;

            if (mod.height) {
                (obj as any).rowSpan = mod.height;
            }

            row.push(obj);

            if (mod.width > 1) {
                for (let c = 1; c < mod.width; c++) //need to fill up with empty cells until row has always the full amount of columns
                    row.push({ text: " ", colSpan: 1, alignment: "center" });
            }
        });
        // Fill up if row is still missing at the end with empty cells +1 because of the starting number
        if (sumColspan < maxColSpan + 1) {
            let diff = maxColSpan - sumColspan;
            for (let c = 0; c <= diff; c++) {
                row.push({ text: " ", colSpan: 1, alignment: "center" });
            }
        }

        tableRows.push(row);
    });

    let cellPaddingInline = 4;
    let cellWidth = (427 / maxColSpan) - (cellPaddingInline * 2);
    let widths = [87 - (2 * 16)];
    for (let c = 0; c < maxColSpan; c++) {
        widths.push(cellWidth);
    }

    let rowSpanCell: any = [];
    let table = {
        style: 'defaultStyle',
        table: {
            headerRows: 1,
            //595 - 2x54 for margins and the rest of widths (487) equal parts 1/6th ~ 81,16periodic 
            // 2*16 is 2*1rem fontsize
            widths: widths,
            body: tableRows
        }, layout: {
            hLineColor: '#ccc',
            vLineColor: '#ccc',
            // Vertical Align Issue - PDFMake - Workarounds: https://github.com/bpampuch/pdfmake/issues/74
            paddingTop: function (index: any, node: any) {
                applyVerticalAlignment(node, index, 'center', rowSpanCell); // -- Vertical Alignment per TableCell arrived in 0.3.4 but does not work if multi row like this table
                return topPad;
            },
            //function (i: number, node: any) { return PADDING_RowTop; },
            // paddingBottom: function (i, node) { return blockPadding; },
            paddingLeft: function (i: any) { return cellPaddingInline },
            paddingRight: function (i: any) { return cellPaddingInline },
            fillColor: function (rowIndex: any) {
                //Color first Row (Table Header), and then each odd row in a color
                return (rowIndex != 0 ? '#fff' : '#eee');
            }
        }
    }
    stacks.push(table);

    return stacks;
}